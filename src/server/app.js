const express = require('express')
const cors = require('cors')

const app = express()

// ------------------ Middlewares globais ------------------
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

// ------------------ Rotas ------------------
const usuarioRoutes = require('../routes/usuario.routes')
const authRoutes = require('../routes/auth.routes')

app.use('/usuario', usuarioRoutes)
app.use('/', authRoutes)


app.get('/', (req, res) => {
    res.status(200).json({message: 'API funcionando!'})
})

module.exports = app
