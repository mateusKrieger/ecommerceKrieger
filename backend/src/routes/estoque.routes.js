const express = require('express')
const router = express.Router()

const { cadastrar, listar } = require('../controllers/estoque.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// POST /estoque  -> registra movimentação (usuário autenticado)
router.post('/', authMiddleware, cadastrar)

// GET /estoque -> lista registros de estoque (usuário autenticado)
router.get('/', authMiddleware, listar)

module.exports = router
