const { Op, fn, col, literal } = require('sequelize')
const { ItemPedido, Produto, Categoria, Pedido, Estoque } = require('../models/rel')
const db = require('../db/conn')

// ──────────────────────────────────────────────────────────
// GET /relatorios/vendas — Vendas por Categoria (ADMIN)
// Retorna: { categoria, totalVendas, totalItens }
// ──────────────────────────────────────────────────────────
async function vendasPorCategoria(req, res) {
    try {
        const resultado = await ItemPedido.findAll({
            attributes: [
                [fn('SUM', col('itemPedido.valorTotalItem')), 'totalVendas'],
                [fn('SUM', col('itemPedido.quantidade')), 'totalItens']
            ],
            include: [
                {
                    model: Produto, as: 'produtoItem',
                    attributes: [],
                    include: [
                        { model: Categoria, as: 'categoriaProduto', attributes: ['nome'] }
                    ]
                }
            ],
            group: ['produtoItem->categoriaProduto.codCategoria', 'produtoItem->categoriaProduto.nome'],
            raw: true
        })

        // Formata para uso direto no Chart.js
        const dados = resultado.map(r => ({
            categoria: r['produtoItem.categoriaProduto.nome'] || 'Sem categoria',
            totalVendas: parseFloat(r.totalVendas) || 0,
            totalItens: parseInt(r.totalItens) || 0
        }))

        return res.status(200).json(dados)
    } catch (err) {
        console.error('Erro no relatório de vendas por categoria:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /relatorios/faturamento — Faturamento Mensal (ADMIN)
// Retorna: { mes, ano, totalFaturado, totalPedidos }
// ──────────────────────────────────────────────────────────
async function faturamentoMensal(req, res) {
    try {
        const resultado = await Pedido.findAll({
            attributes: [
                [fn('MONTH', col('dataPedido')), 'mes'],
                [fn('YEAR', col('dataPedido')), 'ano'],
                [fn('SUM', col('valorTotal')), 'totalFaturado'],
                [fn('COUNT', col('codPedido')), 'totalPedidos']
            ],
            where: {
                status: { [Op.ne]: 'CANCELADO' }
            },
            group: [
                fn('YEAR', col('dataPedido')),
                fn('MONTH', col('dataPedido'))
            ],
            order: [
                [fn('YEAR', col('dataPedido')), 'ASC'],
                [fn('MONTH', col('dataPedido')), 'ASC']
            ],
            raw: true
        })

        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

        const dados = resultado.map(r => ({
            mes: meses[parseInt(r.mes) - 1],
            ano: parseInt(r.ano),
            label: `${meses[parseInt(r.mes) - 1]}/${r.ano}`,
            totalFaturado: parseFloat(r.totalFaturado) || 0,
            totalPedidos: parseInt(r.totalPedidos) || 0
        }))

        return res.status(200).json(dados)
    } catch (err) {
        console.error('Erro no relatório de faturamento mensal:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /relatorios/estoque — Resumo de estoque (ADMIN)
// ──────────────────────────────────────────────────────────
async function resumoEstoque(req, res) {
    try {
        const estoques = await Estoque.findAll({
            include: [{ model: Produto, as: 'produtoEstoque', attributes: ['codProduto', 'nome', 'ativo'] }],
            order: [['quantidade_atual', 'ASC']]
        })

        return res.status(200).json(estoques.map(e => ({
            codEstoque: e.codEstoque,
            produto: e.produtoEstoque?.nome || 'N/A',
            quantidade_atual: e.quantidade_atual,
            quantidade_minima: e.quantidade_minima,
            abaixoMinimo: e.quantidade_atual <= e.quantidade_minima
        })))
    } catch (err) {
        console.error('Erro no relatório de estoque:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { vendasPorCategoria, faturamentoMensal, resumoEstoque }
