const { validarEndereco, inteiro } = require('../validacoes')
const db = require('../db/conn')
const { Pedido, ItemPedido, Entrega, Produto, Estoque, Usuario } = require('../models/rel')

// ──────────────────────────────────────────────────────────
// POST /pedidos — Finalizar pedido (PRIVADO)
// Fluxo: valida estoque → cria pedido → cria itens → cria entrega → deduz estoque
// ──────────────────────────────────────────────────────────
async function criarPedido(req, res) {
    let transaction
    try {
        let { itens, endereco } = req.body
        try { endereco = validarEndereco(endereco) } catch (e) { return res.status(400).json({ erro: e.message }) }
        transaction = await db.transaction()
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

        // Quantidade precisa ser inteira e positiva; soma por produto porque
        // o mesmo produto pode vir em mais de uma linha (um tom por linha)
        const totalPorProduto = Object.create(null)
        for (const item of itens) {
            const quantidade = Number(item.quantidade)
            if (!inteiro(item.idProduto, 1) || !inteiro(item.quantidade, 1)) {
                await transaction.rollback()
                return res.status(400).json({ erro: 'Cada item precisa de idProduto e quantidade inteira maior que zero.' })
            }
            item.quantidade = quantidade
            totalPorProduto[item.idProduto] = (totalPorProduto[item.idProduto] || 0) + quantidade
        }

        // Valida estoque de todos os produtos antes de prosseguir
        for (const [idProduto, quantidade] of Object.entries(totalPorProduto).sort((a, b) => Number(a[0]) - Number(b[0]))) {
            const estoque = await Estoque.findOne({ where: { idProduto }, transaction, lock: transaction.LOCK.UPDATE })
            if (!estoque || estoque.quantidade_atual < quantidade) {
                await transaction.rollback()
                const produto = await Produto.findByPk(idProduto)
                return res.status(400).json({
                    erro: `Estoque insuficiente para o produto "${produto?.nome || idProduto}". Disponível: ${estoque?.quantidade_atual || 0}.`
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
            const precoUnitario = Math.round(Number(produto.preco) * 100) / 100
            const valorTotalItem = precoUnitario * item.quantidade
            valorSubtotal = Math.round((valorSubtotal + valorTotalItem) * 100) / 100
            itensPedido.push({ idProduto: item.idProduto, quantidade: item.quantidade, precoUnitario, valorTotalItem })
        }

        // Frete grátis acima de R$ 150,00
        const valorFrete = valorSubtotal >= 150 ? 0 : 15.90
        const valorTotal = Math.round((valorSubtotal + valorFrete) * 100) / 100

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

        // Deduz estoque de todos os produtos
        for (const [idProduto, quantidade] of Object.entries(totalPorProduto)) {
            const estoque = await Estoque.findOne({ where: { idProduto }, transaction, lock: transaction.LOCK.UPDATE })
            await estoque.update(
                { quantidade_atual: estoque.quantidade_atual - quantidade },
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
        if (transaction && !transaction.finished) await transaction.rollback()
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
        if (!Pedido.rawAttributes.status.values.includes(status)) {
            return res.status(400).json({ erro: `Status inválido. Use: ${Pedido.rawAttributes.status.values.join(', ')}.` })
        }
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
