const { Op } = require('sequelize')
const { Produto, Categoria, Estoque } = require('../models/rel')

// Campos que o admin pode gravar em um produto
const CAMPOS_EDITAVEIS = ['idCategoria', 'nome', 'rotulo', 'descricao', 'historia', 'preco', 'preco_antigo', 'imagem_url', 'imagens', 'tons', 'icone_svg', 'ativo']

// ──────────────────────────────────────────────────────────
// VALIDAÇÃO DOS CAMPOS DE VITRINE (fotos, tons, ícone, preço antigo)
// Retorna a mensagem de erro ou null quando está tudo certo
// ──────────────────────────────────────────────────────────
function validarVitrine(dados) {
    if (dados.preco !== undefined && (dados.preco === null || dados.preco === '' || !Number.isFinite(Number(dados.preco)) || Number(dados.preco) <= 0)) return 'O pre?o deve ser maior que zero.';
    if (dados.nome !== undefined && (typeof dados.nome !== 'string' || !dados.nome.trim())) return 'Nome inv?lido.';
    if (dados.ativo !== undefined && typeof dados.ativo !== 'boolean') return 'Ativo deve ser verdadeiro ou falso.';
    if (dados.imagens !== undefined && dados.imagens !== null) {
        if (!Array.isArray(dados.imagens) || dados.imagens.some(i => typeof i !== 'string' || !i.trim() || i.length > 255)) {
            return 'O campo "imagens" deve ser uma lista de caminhos/URLs de imagem.'
        }
    }
    if (dados.tons !== undefined && dados.tons !== null) {
        if (!Array.isArray(dados.tons)) return 'O campo "tons" deve ser uma lista.'
        for (const tom of dados.tons) {
            if (!tom || typeof tom !== 'object') return 'Tom inválido.'
            if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(tom.cor || '')) {
                return 'Cada tom precisa de uma cor no formato #RRGGBB.'
            }
            if (tom.nome !== undefined && typeof tom.nome !== 'string') return 'Nome de tom inválido.'
            if (tom.imagem !== undefined && tom.imagem !== null && typeof tom.imagem !== 'string') return 'Imagem de tom inválida.'
        }
    }
    if (dados.icone_svg) {
        const svg = String(dados.icone_svg).trim()
        if (!/^<svg[\s>]/i.test(svg) || /<script|\son\w+\s*=|javascript:/i.test(svg)) {
            return 'O ícone deve ser um código <svg> simples, sem scripts.'
        }
    }
    if (dados.preco_antigo !== undefined && dados.preco_antigo !== null && dados.preco_antigo !== '') {
        if (isNaN(parseFloat(dados.preco_antigo)) || parseFloat(dados.preco_antigo) < 0) {
            return 'Preço antigo inválido.'
        }
    }
    return null
}

// Mantém imagem_url sincronizada com a primeira foto da galeria
function prepararVitrine(dados) {
    if (Array.isArray(dados.imagens)) {
        dados.imagens = dados.imagens.map(i => i.trim())
        dados.imagem_url = dados.imagens[0] || dados.imagem_url || null
    }
    if (Array.isArray(dados.tons)) {
        dados.tons = dados.tons.map(t => ({
            nome: (t.nome || '').trim(),
            cor: t.cor,
            imagem: t.imagem ? t.imagem.trim() : null
        }))
    }
    if (dados.preco_antigo === '') dados.preco_antigo = null
    if (dados.icone_svg === '') dados.icone_svg = null
    return dados
}

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
// GET /produtos/todos — Listar ativos e inativos (ADMIN)
// ──────────────────────────────────────────────────────────
async function listarTodos(req, res) {
    try {
        const produtos = await Produto.findAll({
            include: [
                { model: Categoria, as: 'categoriaProduto', attributes: ['codCategoria', 'nome'] },
                { model: Estoque, as: 'estoqueProduto', attributes: ['quantidade_atual', 'quantidade_minima'] }
            ],
            order: [['codProduto', 'ASC']]
        })
        return res.status(200).json(produtos)
    } catch (err) {
        console.error('Erro ao listar todos os produtos:', err)
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
        const { idCategoria, nome, rotulo, descricao, historia, preco, preco_antigo, imagem_url, imagens, tons, icone_svg } = req.body

        if (!idCategoria || !nome || !preco) {
            return res.status(400).json({ erro: 'Campos obrigatórios: idCategoria, nome, preco.' })
        }

        const erroVitrine = validarVitrine(req.body)
        if (erroVitrine) return res.status(400).json({ erro: erroVitrine })

        const categoriaExiste = await Categoria.findByPk(idCategoria)
        if (!categoriaExiste) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        const produto = await Produto.create(prepararVitrine({
            idCategoria, nome, rotulo: rotulo || null, descricao: descricao || null,
            historia: historia || null, preco, preco_antigo: preco_antigo || null, imagem_url: imagem_url || null,
            imagens, tons, icone_svg: icone_svg || null, ativo: true
        }))

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

        const { idCategoria, nome, rotulo, descricao, historia, preco, preco_antigo, imagem_url, imagens, tons, icone_svg, ativo } = req.body
        if (!idCategoria || !nome || !preco) {
            return res.status(400).json({ erro: 'Campos obrigatórios: idCategoria, nome, preco.' })
        }

        const erroVitrine = validarVitrine(req.body)
        if (erroVitrine) return res.status(400).json({ erro: erroVitrine })

        const categoriaExiste = await Categoria.findByPk(idCategoria)
        if (!categoriaExiste) return res.status(404).json({ erro: 'Categoria não encontrada.' })

        await produto.update(prepararVitrine({
            idCategoria, nome, rotulo: rotulo || null, descricao, historia: historia || null, preco,
            preco_antigo: preco_antigo || null, imagem_url, imagens: imagens || [], tons: tons || [],
            icone_svg: icone_svg || null, ativo: ativo !== false
        }))
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

        const erroVitrine = validarVitrine(req.body)
        if (erroVitrine) return res.status(400).json({ erro: erroVitrine })

        // Aceita apenas os campos editáveis (evita alterar a chave primária, por exemplo)
        const campos = {}
        CAMPOS_EDITAVEIS.forEach(c => { if (req.body[c] !== undefined) campos[c] = req.body[c] })
        if (!Object.keys(campos).length) {
            return res.status(400).json({ erro: 'Nenhum campo válido para atualizar.' })
        }

        await produto.update(prepararVitrine(campos))
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

module.exports = { listar, listarTodos, buscar, buscarPorId, criar, atualizar, atualizarParcial, deletar }
