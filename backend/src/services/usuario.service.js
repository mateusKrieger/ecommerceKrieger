const Usuario = require('../models/Usuario')
const { Op } = require('sequelize')
const { validaEmail, validaTelefone, validaCPF } = require('../utils/validacao')
const { hashSenha } = require('../utils/criptografia')

// ======================= CADASTRAR ==========================
async function cadastrar(dados) {
    const { nome, email, telefone, cpf, identidade, senha, tipo_usuario } = dados

    // validações
    if (!nome || !email || !telefone || !cpf || !senha) {
        throw new Error('Campos obrigatórios não informados!')
    }

    if (!validaEmail(email)) throw new Error('Email inválido!')
    if (!validaTelefone(telefone)) throw new Error('Telefone inválido!')
    if (!validaCPF(cpf)) throw new Error('CPF inválido!')

    // duplicidades
    if (await Usuario.findOne({ where: { email } })) {
        throw new Error('Email já cadastrado!')
    }

    if (await Usuario.findOne({ where: { cpf } })) {
        throw new Error('CPF já cadastrado!')
    }

    const senhaBcrypt = await hashSenha(senha)

    await Usuario.create({
        nome,
        email,
        telefone,
        cpf,
        identidade,
        senha: senhaBcrypt,
        tipo_usuario: tipo_usuario
    })

    return { ok: true }
}

// ======================= LISTAR ==========================
async function listar() {
    return await Usuario.findAll()
}

// ======================= CONSULTAR ==========================
async function consultar(nome) {
    return await Usuario.findAll({
        where: {
            nome: { [Op.like]: `%${nome}%` }
        }
    })
}

// ======================= ATUALIZAR ==========================
async function atualizar(id, valores) {
    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        throw new Error('Usuário não encontrado!')
    }

    await Usuario.update(valores, { where: { codUsuario: id } })

    return await Usuario.findByPk(id)
}

// ======================= APAGAR ==========================
async function apagar(id) {
    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        throw new Error('Usuário não encontrado!')
    }

    await Usuario.destroy({ where: { codUsuario: id } })

    return { ok: true }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }