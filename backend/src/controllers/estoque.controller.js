const Usuario = require('../models/Usuario')
const Produto = require('../models/Produto')
const Estoque = require('../models/Estoque')


async function cadastrar(req, res) {
  const valores = req.body

  if (!valores || !valores.idVendedor || !valores.idProduto || !valores.tipo || !valores.data || !valores.qtdeMovimento) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios: idVendedor, idProduto, tipo, data, qtdeMovimento' })
  }

  const qtdeMovimento = Number(valores.qtdeMovimento)
  if (!Number.isFinite(qtdeMovimento) || qtdeMovimento <= 0) {
    return res.status(400).json({ message: 'Quantidade de movimento inválida' })
  }

  try {
    const produto = await Produto.findByPk(valores.idProduto)
    if (!produto) return res.status(404).json({ message: 'Produto não encontrado' })

    const vendedor = await Usuario.findByPk(valores.idVendedor)
    if (!vendedor) return res.status(404).json({ message: 'Vendedor não encontrado' })

 
    let registro = await Estoque.findOne({ where: { idProduto: valores.idProduto } })
    if (!registro) {
      
      registro = await Estoque.create({ idProduto: valores.idProduto, quantidade_atual: 0 })
    }

    let quantidadeAtual = Number(registro.quantidade_atual || 0)
    let novaQuantidade = quantidadeAtual

    if (valores.tipo === 'ENTRADA') {
      novaQuantidade = quantidadeAtual + qtdeMovimento
    } else if (valores.tipo === 'SAIDA') {
      if (quantidadeAtual < qtdeMovimento) {
        return res.status(400).json({ message: 'Estoque insuficiente para saída!' })
      }
      novaQuantidade = quantidadeAtual - qtdeMovimento
    } else {
      return res.status(400).json({ message: 'Tipo de movimento inválido. Use ENTRADA ou SAIDA.' })
    }


    registro.quantidade_atual = novaQuantidade
    await registro.save()

    // Persiste movimento em tabela de histórico
    const MovimentoEstoque = require('../models/MovimentoEstoque')
    await MovimentoEstoque.create({
      idVendedor: valores.idVendedor,
      idProduto: valores.idProduto,
      tipo: valores.tipo,
      data: valores.data,
      qtdeMovimento: qtdeMovimento,
      estoqueAntes: quantidadeAtual,
      estoqueDepois: novaQuantidade
    })

    const movimento = { idVendedor: valores.idVendedor, idProduto: valores.idProduto, tipo: valores.tipo, data: valores.data, qtdeMovimento }

    return res.status(201).json({ message: 'Movimentação registrada com sucesso', novaQuantidade, movimento })
  } catch (err) {
    console.error('Erro ao registrar movimentação de estoque', err)
    return res.status(500).json({ message: 'Erro ao registrar movimentação de estoque' })
  }
}

async function listar(req, res) {
  try {
    const dados = await Estoque.findAll({
      include: [ { model: Produto, as: 'produtoEstoque' } ]
    })
    return res.status(200).json(dados)
  } catch (err) {
    console.error('Erro ao listar os dados', err)
    return res.status(500).json({ message: 'Erro ao listar os dados' })
  }
}

module.exports = { cadastrar, listar }
