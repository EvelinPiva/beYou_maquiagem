// Middleware que verifica se o usuário logado é ADMIN
function isAdmin(req, res, next) {
    if (!req.usuario) {
        return res.status(401).json({ erro: 'Não autenticado.' })
    }
    if (req.usuario.tipo_usuario !== 'ADMIN') {
        return res.status(403).json({ erro: 'Acesso proibido. Apenas administradores.' })
    }
    next()
}

module.exports = isAdmin
