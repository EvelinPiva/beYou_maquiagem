const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const DIRETORIO = path.join(__dirname, '..', 'uploads')

function extensaoImagem(buffer) {
    if (!Buffer.isBuffer(buffer)) return null
    if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && buffer.toString('ascii', 12, 16) === 'IHDR') return 'png'
    if (buffer.length >= 4 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 && buffer[buffer.length - 2] === 255 && buffer[buffer.length - 1] === 217) return 'jpg'
    if (buffer.length >= 20 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
    return null
}

// POST /admin/imagens — Receber uma imagem do computador (ADMIN).
async function enviar(req, res) {
    const extensao = extensaoImagem(req.body)
    if (!extensao) return res.status(400).json({ erro: 'Selecione uma imagem PNG, JPG ou WebP válida.' })
    try {
        await fs.mkdir(DIRETORIO, { recursive: true })
        const nome = `${randomUUID()}.${extensao}`
        await fs.writeFile(path.join(DIRETORIO, nome), req.body, { flag: 'wx' })
        return res.status(201).json({ mensagem: 'Imagem enviada com sucesso.', url: `/uploads/${nome}` })
    } catch (err) {
        console.error('Erro ao enviar imagem:', err)
        return res.status(500).json({ erro: 'Não foi possível salvar a imagem. Tente novamente.' })
    }
}

module.exports = { enviar, extensaoImagem }
