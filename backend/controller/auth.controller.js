require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models/rel')

// POST /login — Autenticação e geração do token JWT
async function login(req, res) {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' })
        }

        // Verifica se o usuário existe
        const usuario = await Usuario.findOne({ where: { email } })
        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' })
        }

        // Compara a senha com o hash armazenado
        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' })
        }

        // Gera o token JWT
        const payload = {
            codUsuario: usuario.codUsuario,
            nome: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '3h'
        })

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                codUsuario: usuario.codUsuario,
                nome: usuario.nome,
                email: usuario.email,
                tipo_usuario: usuario.tipo_usuario
            }
        })

    } catch (err) {
        console.error('Erro no login:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { login }
