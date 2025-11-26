const Entrega = require('../models/Entrega')

async function cadastrarEntrega(req, res) {
    const valores = req.body

    if (!valores || !valores.idPedido || !valores.cep || !valores.logradouro || !valores.bairro || !valores.localidade || !valores.uf || !valores.numero) {
        return res.status(400).json({ message: 'Preencha os campos obrigatórios da entrega.' })
    }

    try {
        const entrega = await Entrega.create(valores)
        return res.status(201).json({ message: 'Entrega cadastrada com sucesso', entrega })
    } catch (err) {
        console.error('Erro ao cadastrar entrega:', err)
        return res.status(500).json({ message: 'Erro ao cadastrar entrega' })
    }
}

module.exports = { cadastrarEntrega }