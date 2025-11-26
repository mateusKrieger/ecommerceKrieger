const sequelize = require('../db/conn')
const ItemPedido = require('../models/ItemPedido')
const Pedido = require('../models/Pedido')
const Produto = require('../models/Produto')
const Estoque = require('../models/Estoque')

// Listar itens (opcionalmente por pedido via query ?pedidoId=)
async function listar(req, res) {
  try {
    const { pedidoId } = req.query
    const where = pedidoId ? { idPedido: pedidoId } : undefined
    const dados = await ItemPedido.findAll({ where, include: [{ model: Produto, as: 'produtoItem' }] })
    return res.status(200).json(dados)
  } catch (err) {
    console.error('Erro ao listar itens de pedido', err)
    return res.status(500).json({ message: 'Erro ao listar itens de pedido' })
  }
}

// Criar item em pedido existente
async function criar(req, res) {
  const { idPedido, idProduto, quantidade } = req.body
  if (!idPedido || !idProduto || !quantidade) return res.status(400).json({ message: 'idPedido, idProduto e quantidade são obrigatórios' })

  const t = await sequelize.transaction()
  try {
    const pedido = await Pedido.findByPk(idPedido, { transaction: t })
    if (!pedido) { await t.rollback(); return res.status(404).json({ message: 'Pedido não encontrado' }) }

    const produto = await Produto.findByPk(idProduto, { transaction: t })
    if (!produto) { await t.rollback(); return res.status(404).json({ message: 'Produto não encontrado' }) }

    const registroEstoque = await Estoque.findOne({ where: { idProduto }, transaction: t })
    const estoqueAtual = Number((registroEstoque && registroEstoque.quantidade_atual) || 0)
    const qtde = Number(quantidade)
    if (estoqueAtual < qtde) { await t.rollback(); return res.status(400).json({ message: 'Estoque insuficiente' }) }

    const precoUnit = Number(produto.preco)
    const valorTotalItem = precoUnit * qtde

    const item = await ItemPedido.create({ idPedido, idProduto, quantidade: qtde, precoUnitario: precoUnit, valorTotalItem }, { transaction: t })

    // atualizar estoque
    registroEstoque.quantidade_atual = estoqueAtual - qtde
    await registroEstoque.save({ transaction: t })

    // atualizar totals do pedido
    const itens = await ItemPedido.findAll({ where: { idPedido }, transaction: t })
    const subtotal = itens.reduce((s, it) => s + Number(it.valorTotalItem), 0)
    await pedido.update({ valorSubtotal: subtotal, valorTotal: subtotal + Number(pedido.valorFrete || 0) }, { transaction: t })

    await t.commit()
    return res.status(201).json({ message: 'Item adicionado', item })
  } catch (err) {
    console.error('Erro ao criar item de pedido', err)
    try { await t.rollback() } catch (e) {}
    return res.status(500).json({ message: 'Erro ao criar item de pedido' })
  }
}

// Deletar item (repõe estoque e atualiza totals)
async function deletar(req, res) {
  const { id } = req.params
  const t = await sequelize.transaction()
  try {
    const item = await ItemPedido.findByPk(id, { transaction: t })
    if (!item) { await t.rollback(); return res.status(404).json({ message: 'Item não encontrado' }) }

    const registroEstoque = await Estoque.findOne({ where: { idProduto: item.idProduto }, transaction: t })
    if (registroEstoque) {
      registroEstoque.quantidade_atual = Number(registroEstoque.quantidade_atual || 0) + Number(item.quantidade)
      await registroEstoque.save({ transaction: t })
    }

    const pedido = await Pedido.findByPk(item.idPedido, { transaction: t })
    await ItemPedido.destroy({ where: { codItemPedido: id }, transaction: t })

    if (pedido) {
      const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido }, transaction: t })
      const subtotal = itens.reduce((s, it) => s + Number(it.valorTotalItem), 0)
      await pedido.update({ valorSubtotal: subtotal, valorTotal: subtotal + Number(pedido.valorFrete || 0) }, { transaction: t })
    }

    await t.commit()
    return res.status(200).json({ message: 'Item removido com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar item de pedido', err)
    try { await t.rollback() } catch (e) {}
    return res.status(500).json({ message: 'Erro ao deletar item de pedido' })
  }
}

module.exports = { listar, criar, deletar }
