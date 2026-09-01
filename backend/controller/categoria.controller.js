const { Categoria } = require('../models/rel')

// GET /categorias — Listar todas (PÚBLICO)
async function listar(req, res) {
    try {
        const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] })
        return res.status(200).json(categorias)
    } catch (err) {
        console.error('Erro ao listar categorias:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// GET /categorias/:id — Buscar por ID (PÚBLICO)
async function buscarPorId(req, res) {
    try {
        const { id } = req.params
        const categoria = await Categoria.findByPk(id)
        if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' })
        return res.status(200).json(categoria)
    } catch (err) {
        console.error('Erro ao buscar categoria:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// GET /categorias/buscar?nome= — Buscar por nome (PÚBLICO)
async function buscarPorNome(req, res) {
    try {
        const { nome } = req.query
        if (!nome) return res.status(400).json({ erro: 'Parâmetro "nome" é obrigatório.' })

        const { Op } = require('sequelize')
        const categorias = await Categoria.findAll({
            where: { nome: { [Op.like]: `%${nome}%` } }
        })
        return res.status(200).json(categorias)
    } catch (err) {
        console.error('Erro ao buscar categoria por nome:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// POST /categorias — Criar (ADMIN)
async function criar(req, res) {
    try {
        const { nome, descricao } = req.body
        if (!nome) return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' })

        const existe = await Categoria.findOne({ where: { nome } })
        if (existe) return res.status(409).json({ erro: 'Categoria já cadastrada com este nome.' })

        const categoria = await Categoria.create({ nome, descricao: descricao || null })
        return res.status(201).json({ mensagem: 'Categoria criada com sucesso!', categoria })
    } catch (err) {
        console.error('Erro ao criar categoria:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PUT /categorias/:id — Atualizar completo (ADMIN)
async function atualizar(req, res) {
    try {
        const { id } = req.params
        const categoria = await Categoria.findByPk(id)
        if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        const { nome, descricao } = req.body
        if (!nome) return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' })

        await categoria.update({ nome, descricao: descricao || null })
        return res.status(200).json({ mensagem: 'Categoria atualizada com sucesso!' })
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PATCH /categorias/:id — Atualizar parcialmente (ADMIN)
async function atualizarParcial(req, res) {
    try {
        const { id } = req.params
        const categoria = await Categoria.findByPk(id)
        if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        await categoria.update(req.body)
        return res.status(200).json({ mensagem: 'Categoria atualizada parcialmente!' })
    } catch (err) {
        console.error('Erro ao atualizar parcialmente categoria:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// DELETE /categorias/:id — Deletar (ADMIN)
async function deletar(req, res) {
    try {
        const { id } = req.params
        const categoria = await Categoria.findByPk(id)
        if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        await categoria.destroy()
        return res.status(200).json({ mensagem: 'Categoria removida com sucesso.' })
    } catch (err) {
        console.error('Erro ao deletar categoria:', err)
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ erro: 'Não é possível remover: há produtos nesta categoria.' })
        }
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { listar, buscarPorId, buscarPorNome, criar, atualizar, atualizarParcial, deletar }
