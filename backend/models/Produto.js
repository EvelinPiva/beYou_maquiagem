const { DataTypes } = require('sequelize')
const db = require('../db/conn')

// Colunas TEXT que guardam listas em JSON (fotos e tons do produto)
function lerLista(valor) {
    if (!valor) return []
    try {
        const lista = JSON.parse(valor)
        return Array.isArray(lista) ? lista : []
    } catch (err) {
        return []
    }
}

function gravarLista(valor) {
    if (typeof valor === 'string') valor = lerLista(valor)
    return Array.isArray(valor) && valor.length ? JSON.stringify(valor) : null
}

const Produto = db.define('produto', {
    codProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idCategoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias',
            key: 'codCategoria'
        }
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    // Texto curto exibido acima do nome no card (ex: BATOM, BASE)
    rotulo: {
        type: DataTypes.STRING(60),
        allowNull: true
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // História do produto exibida na página do produto (parágrafos separados por linha em branco)
    historia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // Preço "de" riscado no card; quando maior que o preço gera o selo de desconto
    preco_antigo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    // Foto principal (card, sacola). Sempre a primeira de "imagens" quando houver
    imagem_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // Galeria da página do produto: ["../img_batom/batom_rosa.png", ...]
    imagens: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() { return lerLista(this.getDataValue('imagens')) },
        set(valor) { this.setDataValue('imagens', gravarLista(valor)) }
    },
    // Tons: [{ nome, cor, imagem }]. Tom sem nome é só ilustrativo (não é escolhido pelo cliente)
    tons: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() { return lerLista(this.getDataValue('tons')) },
        set(valor) { this.setDataValue('tons', gravarLista(valor)) }
    },
    // Ilustração SVG usada quando o produto não tem foto
    icone_svg: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: false,
    tableName: 'produtos'
})

module.exports = Produto
