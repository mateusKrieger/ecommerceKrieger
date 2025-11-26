const express = require('express')
const router = express.Router()

const usuarioController = require('../controllers/usuario.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const isAdminMiddleware = require('../middlewares/isAdmin.middleware')

// Rota pública para cadastro
router.post('/', usuarioController.cadastrar)

// Listar usuários (apenas admin)
router.get('/', authMiddleware, isAdminMiddleware, usuarioController.listar)

// Consultar por nome (usuário autenticado)
router.get('/consultar', authMiddleware, usuarioController.consultar)

// Atualizar usuário (usuário autenticado)
router.put('/:id', authMiddleware, usuarioController.atualizar)

// Apagar usuário (apenas admin)
router.delete('/:id', authMiddleware, isAdminMiddleware, usuarioController.apagar)

module.exports = router
