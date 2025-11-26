const usuarioService = require('../services/usuario.service')

async function cadastrar(req, res) {
    const valores = req.body

    if (!valores.nome ||
        !valores.email ||
        !valores.senha ||
        !valores.telefone ||
        !valores.cpf) {
            return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" })
    }

    try {
        const dados = await usuarioService.cadastrar(valores)
        return res.status(201).json({ message: "Usuário cadastrado com sucesso!", dados })
    } catch (err) {
        console.error("Erro no controller de cadastro:", err)
        return res.status(500).json({ message: "Erro ao cadastrar usuário!", err})
    }
}

async function listar(req, res) {
    try {
        const dados = await usuarioService.listar()
        return res.status(200).json(dados)
    } catch (err) {
        console.error("Erro ao listar usuários!", err)
        return res.status(500).json({ message: "Erro ao listar usuários!" })
    }
}

async function consultar(req, res) {
    const { nome } = req.query

    if(!nome) { 
        return res.status(400).json({message: "Preencha o nome do usuário que deseja buscar!"}) 
    }

    try {
        const dados = await usuarioService.consultar(nome)
        return res.status(200).json(dados)
    } catch (err) {
        console.error("Erro ao consultar usuário!", err)
        return res.status(500).json({ message: "Erro ao consultar usuário!" })
    }
}

async function atualizar(req, res) {
    const valores = req.body
    const { id } = req.params

    if(!id) { 
        return res.status(400).json({message: "Preencha o código do usuário que deseja atualizar!"}) 
    } 
    
        if(!valores.nome && 
           !valores.email &&
           !valores.senha &&
           !valores.telefone &&
           !valores.cpf ) {
            return res.status(400).json({message: "Preencha pelo menos um campo para atualizar!"}) 
        }

    try {
        const dados = await usuarioService.atualizar(id, valores)
        return res.status(200).json({ message: "Usuário atualizado com sucesso!", dados })
    } catch (err) {
        console.error("Erro ao atualizar usuário!", err)
        return res.status(500).json({ message: "Erro ao atualizar usuário!" })
    }
}

async function apagar(req, res) {
    const { id } = req.params

    if(!id) { 
        return res.status(400).json({message: "Preencha o código do usuário que deseja atualizar!"}) 
    }

    try {
        await usuarioService.apagar(id)
        return res.status(200).json({ message: "Usuário deletado com sucesso!" })
    } catch (err) {
        console.error("Erro ao deletar usuário!", err)
        return res.status(500).json({ message: "Erro ao deletar usuário!" })
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }