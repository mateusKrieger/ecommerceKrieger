const express = require('express')
const router = express.Router()

const { listar, criar, deletar } = require('../controllers/itemPedido.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// Protegido: usuário autenticado precisa manipular itens
router.get('/', authMiddleware, listar)
router.post('/', authMiddleware, criar)
router.delete('/:id', authMiddleware, deletar)

module.exports = router
