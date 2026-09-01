const db = require('../db/conn')
const { Pedido, ItemPedido, Entrega, Produto, Estoque, Usuario } = require('../models/rel')

// ──────────────────────────────────────────────────────────
// POST /pedidos — Finalizar pedido (PRIVADO)
// Fluxo: valida estoque → cria pedido → cria itens → cria entrega → deduz estoque
// ──────────────────────────────────────────────────────────
async function criarPedido(req, res) {
    const transaction = await db.transaction()
    try {
        const { itens, endereco } = req.body
        const idUsuario = req.usuario.codUsuario

        // Validações básicas
        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            await transaction.rollback()
            return res.status(400).json({ erro: 'O pedido deve conter ao menos um item.' })
        }
        if (!endereco || !endereco.cep || !endereco.logradouro || !endereco.bairro || !endereco.localidade || !endereco.uf || !endereco.numero) {
            await transaction.rollback()
            return res.status(400).json({ erro: 'Endereço de entrega incompleto.' })
        }

        // Valida estoque de todos os itens antes de prosseguir
        for (const item of itens) {
            const estoque = await Estoque.findOne({ where: { idProduto: item.idProduto }, transaction })
            if (!estoque || estoque.quantidade_atual < item.quantidade) {
                await transaction.rollback()
                const produto = await Produto.findByPk(item.idProduto)
                return res.status(400).json({
                    erro: `Estoque insuficiente para o produto "${produto?.nome || item.idProduto}". Disponível: ${estoque?.quantidade_atual || 0}.`
                })
            }
        }

        // Calcula totais
        let valorSubtotal = 0
        const itensPedido = []

        for (const item of itens) {
            const produto = await Produto.findByPk(item.idProduto, { transaction })
            if (!produto || !produto.ativo) {
                await transaction.rollback()
                return res.status(404).json({ erro: `Produto ID ${item.idProduto} não encontrado ou inativo.` })
            }
            const precoUnitario = parseFloat(produto.preco)
            const valorTotalItem = precoUnitario * item.quantidade
            valorSubtotal += valorTotalItem
            itensPedido.push({ idProduto: item.idProduto, quantidade: item.quantidade, precoUnitario, valorTotalItem })
        }

        // Frete grátis acima de R$ 150,00
        const valorFrete = valorSubtotal >= 150 ? 0 : 15.90
        const valorTotal = valorSubtotal + valorFrete

        // Cria o pedido
        const pedido = await Pedido.create({
            idUsuario, valorSubtotal, valorFrete, valorTotal,
            status: 'PENDENTE_PAGAMENTO'
        }, { transaction })

        // Cria os itens do pedido
        for (const item of itensPedido) {
            await ItemPedido.create({ idPedido: pedido.codPedido, ...item }, { transaction })
        }

        // Cria a entrega
        const dataEstimada = new Date()
        dataEstimada.setDate(dataEstimada.getDate() + 7) // 7 dias úteis estimados

        await Entrega.create({
            idPedido: pedido.codPedido,
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            complemento: endereco.complemento || null,
            bairro: endereco.bairro,
            localidade: endereco.localidade,
            uf: endereco.uf,
            numero: endereco.numero,
            dataEstimada: dataEstimada.toISOString().split('T')[0],
            statusEntrega: 'EM_TRANSITO'
        }, { transaction })

        // Deduz estoque de todos os itens
        for (const item of itens) {
            const estoque = await Estoque.findOne({ where: { idProduto: item.idProduto }, transaction })
            await estoque.update(
                { quantidade_atual: estoque.quantidade_atual - item.quantidade },
                { transaction }
            )
        }

        await transaction.commit()

        return res.status(201).json({
            mensagem: 'Pedido realizado com sucesso!',
            pedido: {
                codPedido: pedido.codPedido,
                valorSubtotal, valorFrete, valorTotal,
                status: pedido.status,
                dataEstimadaEntrega: dataEstimada.toISOString().split('T')[0]
            }
        })

    } catch (err) {
        await transaction.rollback()
        console.error('Erro ao criar pedido:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /pedidos/meus-pedidos — Histórico do cliente logado (PRIVADO)
// ──────────────────────────────────────────────────────────
async function meusPedidos(req, res) {
    try {
        const pedidos = await Pedido.findAll({
            where: { idUsuario: req.usuario.codUsuario },
            include: [
                {
                    model: ItemPedido, as: 'itensPedido',
                    include: [{ model: Produto, as: 'produtoItem', attributes: ['codProduto', 'nome', 'imagem_url'] }]
                },
                { model: Entrega, as: 'entregaPedido' }
            ],
            order: [['dataPedido', 'DESC']]
        })
        return res.status(200).json(pedidos)
    } catch (err) {
        console.error('Erro ao buscar meus pedidos:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// GET /pedidos — Todos os pedidos (ADMIN)
// ──────────────────────────────────────────────────────────
async function listarTodos(req, res) {
    try {
        const pedidos = await Pedido.findAll({
            include: [
                { model: Usuario, as: 'usuarioPedido', attributes: ['codUsuario', 'nome', 'email'] },
                { model: ItemPedido, as: 'itensPedido',
                    include: [{ model: Produto, as: 'produtoItem', attributes: ['codProduto', 'nome'] }]
                },
                { model: Entrega, as: 'entregaPedido' }
            ],
            order: [['dataPedido', 'DESC']]
        })
        return res.status(200).json(pedidos)
    } catch (err) {
        console.error('Erro ao listar pedidos:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PATCH /pedidos/:id/status — Atualizar status (ADMIN)
// ──────────────────────────────────────────────────────────
async function atualizarStatus(req, res) {
    try {
        const { id } = req.params
        const { status } = req.body
        const pedido = await Pedido.findByPk(id)
        if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' })

        await pedido.update({ status })
        return res.status(200).json({ mensagem: 'Status do pedido atualizado!' })
    } catch (err) {
        console.error('Erro ao atualizar status:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { criarPedido, meusPedidos, listarTodos, atualizarStatus }
