const { Entrega, Pedido } = require('../models/rel')

// GET /entregas — Listar todas (ADMIN)
async function listar(req, res) {
    try {
        const entregas = await Entrega.findAll({
            include: [{ model: Pedido, as: 'pedidoEntrega', attributes: ['codPedido', 'status', 'valorTotal'] }],
            order: [['codEntrega', 'DESC']]
        })
        return res.status(200).json(entregas)
    } catch (err) {
        console.error('Erro ao listar entregas:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// GET /entregas/:id — Buscar por ID (ADMIN)
async function buscarPorId(req, res) {
    try {
        const { id } = req.params
        const entrega = await Entrega.findByPk(id, {
            include: [{ model: Pedido, as: 'pedidoEntrega' }]
        })
        if (!entrega) return res.status(404).json({ erro: 'Entrega não encontrada.' })
        return res.status(200).json(entrega)
    } catch (err) {
        console.error('Erro ao buscar entrega:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PUT /entregas/:id — Atualizar entrega (ADMIN)
async function atualizar(req, res) {
    try {
        const { id } = req.params
        const entrega = await Entrega.findByPk(id)
        if (!entrega) return res.status(404).json({ erro: 'Entrega não encontrada.' })

        const { codigoRastreio, statusEntrega, dataEstimada } = req.body
        await entrega.update({ codigoRastreio, statusEntrega, dataEstimada })
        return res.status(200).json({ mensagem: 'Entrega atualizada com sucesso!' })
    } catch (err) {
        console.error('Erro ao atualizar entrega:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// PATCH /entregas/:id — Atualizar parcialmente (ADMIN)
async function atualizarParcial(req, res) {
    try {
        const { id } = req.params
        const entrega = await Entrega.findByPk(id)
        if (!entrega) return res.status(404).json({ erro: 'Entrega não encontrada.' })

        await entrega.update(req.body)
        return res.status(200).json({ mensagem: 'Entrega atualizada parcialmente!' })
    } catch (err) {
        console.error('Erro ao atualizar entrega parcialmente:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { listar, buscarPorId, atualizar, atualizarParcial }
