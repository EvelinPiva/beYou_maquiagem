const db = require('./db/conn')

async function testarConexao() {
    try {
        await db.authenticate()
        console.log('Conexão com o banco de dados realizada com sucesso!')
    } catch (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message)
        process.exitCode = 1
    } finally {
        await db.close()
    }
}

if (require.main === module) {
    testarConexao().catch(err => {
        console.error('Erro ao encerrar a conexão:', err.message)
        process.exitCode = 1
    })
}

module.exports = db