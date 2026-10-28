const { DataTypes } = require('sequelize')
const db = require('../db/conn')

// Textos e imagens editáveis do site (topo, módulos, newsletter, rodapé...)
// Cada linha é um par chave/valor; as chaves válidas ficam em conteudo.controller.js
const Conteudo = db.define('conteudo', {
    codConteudo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chave: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true
    },
    valor: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'conteudos'
})

module.exports = Conteudo
