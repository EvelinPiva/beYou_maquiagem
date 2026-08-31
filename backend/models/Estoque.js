const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Estoque = db.define('estoque', {
    codEstoque: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idProduto: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'produtos', 
            key: 'codProduto'  
        }
    },
    quantidade_atual: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    quantidade_minima: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    timestamps: false, 
    tableName: 'estoques'
})

module.exports = Estoque