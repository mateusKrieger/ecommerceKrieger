const sequelize = require('../db/conn')
const Pedido = require('../models/Pedido')
const ItemPedido = require('../models/ItemPedido')
const Produto = require('../models/Produto')
const Estoque = require('../models/Estoque')
const Usuario = require('../models/Usuario')

// Listar todos os pedidos (com itens)
async function listar(req, res) {
  try {
    const pedidos = await Pedido.findAll({
      include: [ { model: ItemPedido, as: 'itensPedido', include: [{ model: Produto, as: 'produtoItem' }] }, { model: Usuario, as: 'usuarioPedido' } ]
    })
    return res.status(200).json(pedidos)
  } catch (err) {
    console.error('Erro ao listar pedidos', err)
    return res.status(500).json({ message: 'Erro ao listar pedidos' })
  }
}

// Consultar por id
async function consultar(req, res) {
  try {
    const { id } = req.params
    const pedido = await Pedido.findByPk(id, { include: [ { model: ItemPedido, as: 'itensPedido', include: [{ model: Produto, as: 'produtoItem' }] }, { model: Usuario, as: 'usuarioPedido' } ] })
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado' })
    return res.status(200).json(pedido)
  } catch (err) {
    console.error('Erro ao consultar pedido', err)
    return res.status(500).json({ message: 'Erro ao consultar pedido' })
  }
}

// Criar pedido com itens — operação atômica
async function criar(req, res) {
  const { idUsuario, itens } = req.body
  if (!idUsuario || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'idUsuario e itens são obrigatórios' })
  }

  const t = await sequelize.transaction()
  try {
    const usuario = await Usuario.findByPk(idUsuario, { transaction: t })
    if (!usuario) {
      await t.rollback()
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    // criar pedido inicial (valores serão atualizados)
    const pedido = await Pedido.create({ idUsuario, valorSubtotal: 0.00, valorFrete: 0.00, valorTotal: 0.00 }, { transaction: t })

    let subtotal = 0

    for (const it of itens) {
      const produto = await Produto.findByPk(it.idProduto, { transaction: t })
      if (!produto) {
        await t.rollback()
        return res.status(404).json({ message: `Produto ${it.idProduto} não encontrado` })
      }

      const registroEstoque = await Estoque.findOne({ where: { idProduto: it.idProduto }, transaction: t })
      const estoqueAtual = Number((registroEstoque && registroEstoque.quantidade_atual) || 0)
      const qtde = Number(it.quantidade)
      if (!Number.isFinite(qtde) || qtde <= 0) {
        await t.rollback()
        return res.status(400).json({ message: 'Quantidade inválida em itens' })
      }

      if (estoqueAtual < qtde) {
        await t.rollback()
        return res.status(400).json({ message: `Estoque insuficiente para produto ${produto.nome}` })
      }

      const precoUnit = Number(produto.preco)
      const valorTotalItem = precoUnit * qtde

      // cria item
      await ItemPedido.create({ idPedido: pedido.codPedido, idProduto: produto.codProduto, quantidade: qtde, precoUnitario: precoUnit, valorTotalItem }, { transaction: t })

      // decrementa estoque
      registroEstoque.quantidade_atual = estoqueAtual - qtde
      await registroEstoque.save({ transaction: t })

      subtotal += valorTotalItem
    }

    const valorFrete = 0.00
    const valorTotal = subtotal + valorFrete

    await pedido.update({ valorSubtotal: subtotal, valorFrete, valorTotal }, { transaction: t })

    await t.commit()

    const criado = await Pedido.findByPk(pedido.codPedido, { include: [{ model: ItemPedido, as: 'itensPedido', include: [{ model: Produto, as: 'produtoItem' }] }] })
    return res.status(201).json({ message: 'Pedido criado com sucesso', pedido: criado })
  } catch (err) {
    console.error('Erro ao criar pedido', err)
    try { await t.rollback() } catch (e) {}
    return res.status(500).json({ message: 'Erro ao criar pedido' })
  }
}

// Atualizar status simples (ex: alterar status do pedido)
async function atualizar(req, res) {
  try {
    const { id } = req.params
    const valores = req.body
    const pedido = await Pedido.findByPk(id)
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado' })
    await pedido.update(valores)
    return res.status(200).json({ message: 'Pedido atualizado com sucesso', pedido })
  } catch (err) {
    console.error('Erro ao atualizar pedido', err)
    return res.status(500).json({ message: 'Erro ao atualizar pedido' })
  }
}

// Deletar pedido (atenção: não repõe estoque automaticamente aqui)
async function deletar(req, res) {
  try {
    const { id } = req.params
    const pedido = await Pedido.findByPk(id)
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado' })
    await Pedido.destroy({ where: { codPedido: id } })
    return res.status(200).json({ message: 'Pedido deletado com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar pedido', err)
    return res.status(500).json({ message: 'Erro ao deletar pedido' })
  }
}

module.exports = { listar, consultar, criar, atualizar, deletar }
