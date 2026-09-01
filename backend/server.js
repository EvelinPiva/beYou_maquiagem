require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Importa os relacionamentos (necessário para o Sequelize reconhecer as associações)
require('./models/rel')

const routes = require('./routes/index')

const app = express()
const PORT = process.env.PORT || 3000

// ─── Middlewares globais ───────────────────────────────────
app.use(cors({
    origin: '*', // Em produção: substituir pelo domínio do Vercel
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Rota de saúde ────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        mensagem: '🌸 BE YOU Maquiagem — API REST',
        versao: '1.0.0',
        status: 'online'
    })
})

// ─── Rotas da API ─────────────────────────────────────────
app.use('/api', routes)

// ─── Rota 404 ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' })
})

// ─── Inicialização e Sincronização com o Banco ──────────────
const db = require('./db/conn')

db.sync({ alter: true }).then(() => {
    console.log('📦 Tabelas do banco de dados sincronizadas com sucesso!')
    app.listen(PORT, () => {
        console.log(`\n🌸 BE YOU — Backend rodando em http://localhost:${PORT}`)
        console.log(`📋 Endpoints disponíveis em http://localhost:${PORT}/api\n`)
    })
}).catch(err => {
    console.error('❌ Erro ao sincronizar o banco de dados:', err)
})

module.exports = app
