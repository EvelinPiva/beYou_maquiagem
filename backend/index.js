const app = require('./server')
const db = require('./db/conn')
const PORT = process.env.PORT || 3000

async function iniciarServidor() {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_LONGA') throw new Error('Configure JWT_SECRET no arquivo backend/.env.');
        await require('./estrutura')()
        const server = app.listen(PORT, () => {
            console.log(`BE YOU — Backend rodando em http://localhost:${PORT}`)
            console.log(`Endpoints disponíveis em http://localhost:${PORT}/api`)
        })
        server.on('error', async err => {
            console.error('Erro ao iniciar o servidor:', err.message)
            process.exitCode = 1
            await db.close()
        })
    } catch (err) {
        console.error('Não foi possível iniciar o servidor:', err.message)
        process.exitCode = 1
        await db.close()
    }
}

iniciarServidor().catch(err => {
    console.error('Erro ao encerrar a conexão:', err.message)
    process.exitCode = 1
})