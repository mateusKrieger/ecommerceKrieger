const express = require('express')
const router = express.Router()

const { listar, consultar, criar, atualizar, deletar } = require('../controllers/pedido.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// Todas as rotas de pedido exigem autenticação
router.get('/', authMiddleware, listar)
router.get('/:id', authMiddleware, consultar)
router.post('/', authMiddleware, criar)
router.put('/:id', authMiddleware, atualizar)
router.delete('/:id', authMiddleware, deletar)

module.exports = router
