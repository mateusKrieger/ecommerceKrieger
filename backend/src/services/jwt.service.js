const jwt = require('jsonwebtoken')
require('dotenv').config()  // carregar as variáveis de ambiente
const SEGREDO = process.env.JWT_SECRET
const tempo = process.env.JWT_EXPIRES_IN

function gerarToken(payload){
    return jwt.sign(payload, SEGREDO, {expiresIn: tempo})
}

function verificarToken(token){
    try{
        return jwt.verify(token, SEGREDO)
    }catch(err){
        console.error('Erro ao verificar o token!')
        return null
    }
}

module.exports = { gerarToken, verificarToken }