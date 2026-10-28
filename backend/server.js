require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')

// Importa os relacionamentos (necessário para o Sequelize reconhecer as associações)
require('./models/rel')

const routes = require('./routes/index')

const app = express()


// ─── Middlewares globais ───────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : '*', // Em produção: substituir pelo domínio do Vercel
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Rota de saúde ────────────────────────────────────────
app.get('/api/saude', (req, res) => {
    res.json({
        mensagem: '🌸 BE YOU Maquiagem — API REST',
        versao: '1.0.0',
        status: 'online'
    })
})

// ─── Rotas da API ─────────────────────────────────────────
app.use('/api', routes)

// Página de acesso administrativo e seus arquivos estáticos.
const path = require('path')
app.get('/', (req, res) => res.redirect('/frontend/index.html'))
app.get('/admin', (req, res) => {
    res.redirect('/frontend/admin/index.html')
})
app.use('/frontend', express.static(path.join(__dirname, '../frontend')))
app.use('/img', express.static(path.join(__dirname, '../img')))
app.use('/img_batom', express.static(path.join(__dirname, '../img_batom')))
// Recursos da loja e imagens enviadas pelo painel.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    index: false,
    dotfiles: 'deny',
    setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff')
}))
for (const pasta of require('fs').readdirSync(path.join(__dirname, '..'), { withFileTypes: true })) {
    if (pasta.isDirectory() && pasta.name.startsWith('img_')) {
        app.use('/' + pasta.name, express.static(path.join(__dirname, '..', pasta.name)))
    }
}
app.get('/1.mp4', (req, res) => res.sendFile(path.join(__dirname, '../1.mp4')))
app.get('/admin/', (req, res) => res.redirect('/frontend/admin/index.html'))
// ─── Rota 404 ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' })
})

module.exports = app
