require('dotenv').config()
const jwt = require('jsonwebtoken')

// Middleware de autenticação JWT
function auth(req, res, next) {
    const authHeader = req.headers['authorization']

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido. Acesso negado.' })
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Token mal formatado. Use: Bearer <token>' })
    }

    const token = parts[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = decoded // { codUsuario, nome, email, tipo_usuario }
        next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ erro: 'Token expirado. Faça login novamente.' })
        }
        return res.status(401).json({ erro: 'Token inválido.' })
    }
}

module.exports = auth
