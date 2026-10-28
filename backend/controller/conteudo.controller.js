const db = require('../db/conn')
const { Conteudo } = require('../models/rel')
const PAGINAS = require('./paginas.padrao')

// ──────────────────────────────────────────────────────────
// CHAVES VÁLIDAS E VALORES PADRÃO
// São os textos originais do site; valem enquanto o admin não salvar outro valor.
// Trechos entre *asteriscos* aparecem em destaque (itálico rosa) no frontend.
// ──────────────────────────────────────────────────────────
const PADROES = {
    anuncio: 'Frete grátis nas compras acima de *R$ 150* · 3x sem juros em todo o site',
    hero_titulo: 'Maquiagem que veste *a sua* versão favorita',
    hero_texto: 'Do rosto aos olhos, tudo o que você precisa para montar seu look — selecionado a dedo, com tonalidades para todo tipo de pele.',
    hero_botao_1: 'Descobrir maquiagens',
    hero_botao_2: 'Ver lançamentos',
    hero_imagem: '../img/EVELIN.png',
    hero_imagem_alt: 'Evelin Piva segurando batom vermelho BE YOU',
    historia_titulo: 'Nossa *história*',
    historia_texto: "A BE YOU nasceu em 2026, quando decidi unir publicidade e maquiagem. Criando propagandas e testando diferentes produtos no meu próprio rosto, surgiu a ideia de uma marca com uma mensagem simples: *seja você*.\n\nProdutos pensados para diferentes tipos e tons de pele, liberdade para experimentar e interesse pela inovação no cuidado com a pele. Uma história que começa com criatividade e continua com você.",
    historia_imagem: '../img_base/base_medio03.png',
    modulo_1: 'Entrega em todo o Brasil',
    modulo_2: 'Compra 100% segura',
    modulo_3: 'Troca grátis em 30 dias',
    modulo_4: '3x sem juros no cartão',
    catalogo_titulo: 'Compre por categoria',
    catalogo_chamada: 'Nossa vitrine',
    catalogo_subtitulo: 'Escolha uma categoria ou veja tudo de uma vez.',
    historia_chamada: 'Desde 2026',
    historia_imagem_2: '../img_blush/blush_rosa.png',
    historia_imagem_3: '../img_batom/batom_nude-claro.png',
    historia_botao: 'Conheça a BE YOU',
    promocoes_chamada: 'Seleção especial BE YOU',
    promocoes_titulo: 'Seu próximo favorito, por *menos*.',
    promocoes_texto: 'Uma seleção de beleza com preços que dão vontade de levar. Encontre seu novo favorito entre os produtos em promoção.',
    promocoes_botao: 'Quero aproveitar',
    promocoes_imagem: '../img_batom/gloss_BEYOU-claro.png',
    promocoes_imagem_alt: 'Gloss BE YOU em fundo rosa claro',
    promocoes_lista_titulo: 'Pequenos luxos. *Ótimos achados.*',
    promocoes_lista_texto: 'Os descontos já estão aplicados nos preços abaixo. Escolha o seu favorito.',
    promocoes_vazio: 'Novas ofertas estão a caminho. Enquanto isso, descubra nossos favoritos no catálogo.',
    newsletter_titulo: 'Fique por dentro das promoções',
    newsletter_texto: 'Cadastre seu e-mail e receba lançamentos, cupons e novidades da BE YOU antes de todo mundo.',
    newsletter_nota: 'Sem spam. Você pode cancelar quando quiser.',
    rodape_texto: 'A BE YOU nasceu para simplificar a maquiagem: produtos selecionados, tonalidades para todo tipo de pele e uma compra rápida, do clique à entrega.',
    rede_instagram: '',
    rede_tiktok: '',
    rede_whatsapp: '',
    ...PAGINAS
}

// Páginas institucionais são textos longos; os demais campos são curtos
const tamanhoMaximo = (chave) => chave.startsWith('pagina_') ? 20000 : 2000
const REDES = new Set(['rede_instagram', 'rede_tiktok', 'rede_whatsapp'])

function numeroWhatsApp(valor) {
    const texto = valor.trim()
    if (!texto) return ''
    if (!/^[\d\s()+.\-]+$/.test(texto)) return null
    let numero = texto.replace(/\D/g, '')
    if (numero.length === 10 || numero.length === 11) numero = '55' + numero
    return /^55[1-9]{2}\d{8,9}$/.test(numero) ? numero : null
}

async function montarConteudo() {
    const registros = await Conteudo.findAll()
    const conteudo = { ...PADROES }
    registros.forEach(r => {
        if (r.chave in PADROES && r.valor !== null) conteudo[r.chave] = r.valor
    })
    // Compatibilidade com links wa.me salvos antes do campo de telefone.
    if (/^https:\/\/wa\.me\/\d+\/?(?:\?.*)?$/.test(conteudo.rede_whatsapp)) {
        conteudo.rede_whatsapp = conteudo.rede_whatsapp.match(/^https:\/\/wa\.me\/(\d+)/)[1]
    }
    return conteudo
}

// ──────────────────────────────────────────────────────────
// GET /conteudos — Conteúdo atual do site (PÚBLICO)
// ──────────────────────────────────────────────────────────
async function listar(req, res) {
    try {
        return res.status(200).json(await montarConteudo())
    } catch (err) {
        console.error('Erro ao listar conteúdo do site:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

// ──────────────────────────────────────────────────────────
// PUT /conteudos — Salvar um ou mais campos (ADMIN)
// Corpo: { "hero_titulo": "...", "modulo_1": "..." }
// ──────────────────────────────────────────────────────────
async function atualizar(req, res) {
    const campos = req.body || {}
    const chaves = Object.keys(campos)

    if (!chaves.length) {
        return res.status(400).json({ erro: 'Envie ao menos um campo de conteúdo.' })
    }
    for (const chave of chaves) {
        if (!(chave in PADROES)) {
            return res.status(400).json({ erro: `Campo de conteúdo desconhecido: "${chave}".` })
        }
        if (typeof campos[chave] !== 'string' || (!campos[chave].trim() && !REDES.has(chave))) {
            return res.status(400).json({ erro: `O campo "${chave}" não pode ficar vazio.` })
        }
        if (campos[chave].length > tamanhoMaximo(chave)) {
            return res.status(400).json({ erro: `O campo "${chave}" passa de ${tamanhoMaximo(chave)} caracteres.` })
        }
        if (chave === 'rede_whatsapp' && numeroWhatsApp(campos[chave]) === null) {
            return res.status(400).json({ erro: 'Informe um número de WhatsApp com DDD (10 ou 11 dígitos), com +55 opcional, ou deixe vazio para ocultar.' })
        }
        if (REDES.has(chave) && chave !== 'rede_whatsapp' && campos[chave].trim()) {
            try {
                const url = new URL(campos[chave].trim())
                if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('URL inválida')
            } catch (err) {
                return res.status(400).json({ erro: `Informe um link completo com https:// para "${chave}" ou deixe vazio para ocultar.` })
            }
        }
    }

    const transaction = await db.transaction()
    try {
        for (const chave of chaves) {
            const valor = chave === 'rede_whatsapp' ? numeroWhatsApp(campos[chave]) : campos[chave].trim()
            const existente = await Conteudo.findOne({ where: { chave }, transaction })
            if (existente) {
                await existente.update({ valor }, { transaction })
            } else {
                await Conteudo.create({ chave, valor }, { transaction })
            }
        }
        await transaction.commit()

        return res.status(200).json({
            mensagem: 'Conteúdo do site atualizado com sucesso!',
            conteudo: await montarConteudo()
        })
    } catch (err) {
        await transaction.rollback()
        console.error('Erro ao atualizar conteúdo do site:', err)
        return res.status(500).json({ erro: 'Erro interno no servidor.' })
    }
}

module.exports = { listar, atualizar, PADROES }
