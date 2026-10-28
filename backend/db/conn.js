require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Sequelize } = require('sequelize')

const options = { host: process.env.DB_HOST || 'localhost', dialect: 'mysql', port: Number(process.env.DB_PORT) || 3306, logging: false }
const db = process.env.MYSQL_URL ? new Sequelize(process.env.MYSQL_URL, options) : new Sequelize(
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

module.exports = db
