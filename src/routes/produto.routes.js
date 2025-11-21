const express = require('express')
const router = express.Router()

const { criar, listar, atualizar,
    atualizarCompleto, deletar } = require('../controllers/produto.controller')

// Middlewares
const authMiddleware = require('../middlewares/auth.middleware')
const isAdminMiddleware = require('../middlewares/isAdmin.middleware')

// POST /produto
router.post(
    '/',
    authMiddleware,      // precisa estar logado
    isAdminMiddleware,   // precisa ser admin
    criar
)

// GET – Listar produtos (qualquer usuário logado)
router.get(
'/',
authMiddleware,
listar
)

// Atualizar parcialmente produto (ADMIN)
router.patch(
'/:id',
authMiddleware,
isAdminMiddleware,
atualizar
)

// PUT - completo
router.put(
    '/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    atualizarCompleto
)

// DELETE
router.delete(
    '/:id',
    authMiddleware,
    isAdminMiddleware,
    deletar
)

module.exports = router
