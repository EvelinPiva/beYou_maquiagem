const { Op } = require('sequelize')
const { Produto, Categoria, Estoque } = require('../models/rel')

// ──────────────────────────────────────────────────────────
// GET /produtos — Listar todos (PÚBLICO) com estoque
// ──────────────────────────────────────────────────────────
async function listar(req, res) {
    try {
        const produtos = await Produto.findAll({
            where: { ativo: true },
            include: [
                { model: Categoria, as: 'categoriaProduto', attributes: ['codCategoria', 'nome'] },
                { model: Estoque, as: 'estoqueProduto', attributes: ['quantidade_atual', 'quantidade_minima'] }
            ],
            order: [['nome', 'ASC']]
        })
        return res.status(200).json(produtos)
    } catch (err) {
        console.error('Erro ao listar produtos:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /produtos/buscar?nome=&categoria= — Filtro (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function buscar(req, res) {
    try {
        const { nome, categoria } = req.query
        const where = { ativo: true }

        if (nome) where.nome = { [Op.like]: `%${nome}%` }

        const include = [
            { model: Categoria, as: 'categoriaProduto', attributes: ['codCategoria', 'nome'] },
            { model: Estoque, as: 'estoqueProduto', attributes: ['quantidade_atual'] }
        ]

        if (categoria) {
            include[0].where = { nome: { [Op.like]: `%${categoria}%` } }
            include[0].required = true
        }

        const produtos = await Produto.findAll({ where, include, order: [['nome', 'ASC']] })
        return res.status(200).json(produtos)
    } catch (err) {
        console.error('Erro ao buscar produtos:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /produtos/:id — Detalhe de produto (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function buscarPorId(req, res) {
    try {
        const { id } = req.params
        const produto = await Produto.findByPk(id, {
            include: [
                { model: Categoria, as: 'categoriaProduto', attributes: ['codCategoria', 'nome'] },
                { model: Estoque, as: 'estoqueProduto' }
            ]
        })
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' })
        return res.status(200).json(produto)
    } catch (err) {
        console.error('Erro ao buscar produto:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// POST /produtos — Criar (ADMIN)
// ──────────────────────────────────────────────────────────
async function criar(req, res) {
    try {
        const { idCategoria, nome, descricao, preco, imagem_url } = req.body

        if (!idCategoria || !nome || !preco) {
            return res.status(400).json({ erro: 'Campos obrigatórios: idCategoria, nome, preco.' })
        }

        const categoriaExiste = await Categoria.findByPk(idCategoria)
        if (!categoriaExiste) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        const produto = await Produto.create({
            idCategoria, nome, descricao: descricao || null,
            preco, imagem_url: imagem_url || null, ativo: true
        })

        // Cria registro de estoque zerado para o produto
        await Estoque.create({ idProduto: produto.codProduto, quantidade_atual: 0, quantidade_minima: 5 })

        return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto })
    } catch (err) {
        console.error('Erro ao criar produto:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PUT /produtos/:id — Atualizar completo (ADMIN)
// ──────────────────────────────────────────────────────────
async function atualizar(req, res) {
    try {
        const { id } = req.params
        const produto = await Produto.findByPk(id)
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' })

        const { idCategoria, nome, descricao, preco, imagem_url, ativo } = req.body
        if (!idCategoria || !nome || !preco) {
            return res.status(400).json({ erro: 'Campos obrigatórios: idCategoria, nome, preco.' })
        }

        await produto.update({ idCategoria, nome, descricao, preco, imagem_url, ativo })
        return res.status(200).json({ mensagem: 'Produto atualizado com sucesso!' })
    } catch (err) {
        console.error('Erro ao atualizar produto:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PATCH /produtos/:id — Atualizar parcialmente (ADMIN)
// ──────────────────────────────────────────────────────────
async function atualizarParcial(req, res) {
    try {
        const { id } = req.params
        const produto = await Produto.findByPk(id)
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' })

        await produto.update(req.body)
        return res.status(200).json({ mensagem: 'Produto atualizado parcialmente!' })
    } catch (err) {
        console.error('Erro ao atualizar parcialmente produto:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// DELETE /produtos/:id — Desativar produto (ADMIN)
// ──────────────────────────────────────────────────────────
async function deletar(req, res) {
    try {
        const { id } = req.params
        const produto = await Produto.findByPk(id)
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' })

        // Soft delete: desativa o produto em vez de excluir
        await produto.update({ ativo: false })
        return res.status(200).json({ mensagem: 'Produto desativado com sucesso.' })
    } catch (err) {
        console.error('Erro ao deletar produto:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { listar, buscar, buscarPorId, criar, atualizar, atualizarParcial, deletar }
