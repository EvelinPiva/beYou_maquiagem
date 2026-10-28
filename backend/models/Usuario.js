const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Usuario = db.define('usuario', {
    codUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    cpf: { 
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: true
    },
    identidade: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    cep: { type: DataTypes.STRING(9), allowNull: true },
    logradouro: { type: DataTypes.STRING(70), allowNull: true },
    numero: { type: DataTypes.STRING(12), allowNull: true },
    complemento: { type: DataTypes.STRING(100), allowNull: true },
    bairro: { type: DataTypes.STRING(70), allowNull: true },
    localidade: { type: DataTypes.STRING(70), allowNull: true },
    uf: { type: DataTypes.STRING(2), allowNull: true },
    tipo_usuario: {
        type: DataTypes.ENUM('CLIENTE', 'ADMIN'),
        allowNull: false,
        defaultValue: 'CLIENTE'
    }
}, {
    timestamps: false, 
    tableName: 'usuarios'
})

module.exports = Usuario