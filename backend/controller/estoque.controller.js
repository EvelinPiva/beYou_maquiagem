const { Estoque, Produto } = require('../models/rel')

// GET /estoque — Listar todos (ADMIN)
async function listar(req, res) {
    try {
        const estoques = await Estoque.findAll({
            include: [{ model: Produto, as: 'produtoEstoque', attributes: ['codProduto', 'nome', 'preco'] }],
            order: [['codEstoque', 'ASC']]
        })
        return res.status(200).json(estoques)
    } catch (err) {
        console.error('Erro ao listar estoque:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// GET /estoque/:id — Buscar por ID (ADMIN)
async function buscarPorId(req, res) {
    try {
        const { id } = req.params
        const estoque = await Estoque.findByPk(id, {
            include: [{ model: Produto, as: 'produtoEstoque', attributes: ['codProduto', 'nome', 'preco'] }]
        })
        if (!estoque) return res.status(404).json({ erro: 'Registro de estoque não encontrado.' })
        return res.status(200).json(estoque)
    } catch (err) {
        console.error('Erro ao buscar estoque:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// POST /estoque — Entrada/Saída de estoque (ADMIN)
async function movimentar(req, res) {
    try {
        const { idProduto, quantidade, tipo, quantidade_minima } = req.body
        // tipo: 'ENTRADA' ou 'SAIDA'

        if (!idProduto || quantidade === undefined) {
            return res.status(400).json({ erro: 'Campos obrigatórios: idProduto, quantidade.' })
        }

        const produto = await Produto.findByPk(idProduto)
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' })

        let estoque = await Estoque.findOne({ where: { idProduto } })

        if (!estoque) {
            // Cria se não existir
            estoque = await Estoque.create({
                idProduto,
                quantidade_atual: 0,
                quantidade_minima: quantidade_minima || 5
            })
        }

        if (tipo === 'SAIDA') {
            if (estoque.quantidade_atual < quantidade) {
                return res.status(400).json({ erro: 'Quantidade insuficiente em estoque.' })
            }
            await estoque.update({ quantidade_atual: estoque.quantidade_atual - quantidade })
        } else {
            // ENTRADA (padrão)
            await estoque.update({
                quantidade_atual: estoque.quantidade_atual + parseInt(quantidade),
                quantidade_minima: quantidade_minima || estoque.quantidade_minima
            })
        }

        return res.status(200).json({
            mensagem: `Estoque ${tipo === 'SAIDA' ? 'reduzido' : 'adicionado'} com sucesso!`,
            estoque: await Estoque.findByPk(estoque.codEstoque)
        })
    } catch (err) {
        console.error('Erro ao movimentar estoque:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PUT /estoque/:id — Atualizar quantidade diretamente (ADMIN)
async function atualizar(req, res) {
    try {
        const { id } = req.params
        const estoque = await Estoque.findByPk(id)
        if (!estoque) return res.status(404).json({ erro: 'Estoque não encontrado.' })

        const { quantidade_atual, quantidade_minima } = req.body
        await estoque.update({
            quantidade_atual: quantidade_atual !== undefined ? quantidade_atual : estoque.quantidade_atual,
            quantidade_minima: quantidade_minima !== undefined ? quantidade_minima : estoque.quantidade_minima
        })
        return res.status(200).json({ mensagem: 'Estoque atualizado com sucesso!' })
    } catch (err) {
        console.error('Erro ao atualizar estoque:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PATCH /estoque/:id — Atualizar parcialmente (ADMIN)
async function atualizarParcial(req, res) {
    try {
        const { id } = req.params
        const estoque = await Estoque.findByPk(id)
        if (!estoque) return res.status(404).json({ erro: 'Estoque não encontrado.' })

        await estoque.update(req.body)
        return res.status(200).json({ mensagem: 'Estoque atualizado parcialmente!' })
    } catch (err) {
        console.error('Erro ao atualizar estoque parcialmente:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { listar, buscarPorId, movimentar, atualizar, atualizarParcial }
