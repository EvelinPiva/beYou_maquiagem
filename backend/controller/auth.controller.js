require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models/rel')

// ──────────────────────────────────────────────────────────
// Valida e-mail/senha e devolve o usuário (ou null se as credenciais não conferem)
// ──────────────────────────────────────────────────────────
async function conferirCredenciais(email, senha) {
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario) return null
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    return senhaValida ? usuario : null
}

function gerarSessao(usuario) {
    const dados = {
        codUsuario: usuario.codUsuario,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario
    }
    const token = jwt.sign(dados, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '3h'
    })
    return { mensagem: 'Login realizado com sucesso!', token, usuario: dados }
}

// ──────────────────────────────────────────────────────────
// POST /login — Login da loja: só contas de CLIENTE (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function login(req, res) {
    try {
        const { email, senha } = req.body
        if (!email || !senha) {
            return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' })
        }

        const usuario = await conferirCredenciais(email, senha)
        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' })
        }

        // Conta de administrador não entra pela loja: o acesso é pelo painel /admin
        if (usuario.tipo_usuario !== 'CLIENTE') {
            return res.status(403).json({ erro: 'Esta é uma conta administrativa. Acesse pelo painel /admin.' })
        }

        return res.status(200).json(gerarSessao(usuario))
    } catch (err) {
        console.error('Erro no login:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// POST /admin/login — Login do painel: só contas ADMIN (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function loginAdmin(req, res) {
    try {
        const { email, senha } = req.body
        if (!email || !senha) {
            return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' })
        }

        // Cliente com senha certa recebe a mesma mensagem genérica: o painel não revela quem é cliente
        const usuario = await conferirCredenciais(email, senha)
        if (!usuario || usuario.tipo_usuario !== 'ADMIN') {
            return res.status(401).json({ erro: 'Credenciais inválidas.' })
        }

        return res.status(200).json(gerarSessao(usuario))
    } catch (err) {
        console.error('Erro no login do painel:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { login, loginAdmin }
