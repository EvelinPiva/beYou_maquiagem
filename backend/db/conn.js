require('dotenv').config()
const { Sequelize } = require('sequelize')

const db = new Sequelize(
    process.env.DB_NAME || 'db_ecommerce',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'senai',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false
    }
)

db.authenticate()
    .then(() => {
        console.log('✅ Conexão com o banco de dados realizada com sucesso!')
    })
    .catch((err) => {
        console.error('❌ Erro ao conectar com banco de dados!', err)
    })

module.exports = db