require('dotenv').config()
const bcrypt = require('bcryptjs')
const conn = require('./db/conn')
const { Categoria, Produto, Estoque, Usuario } = require('./models/rel')

// ──────────────────────────────────────────────────────────
// CARGA INICIAL DO CATÁLOGO (npm run seed)
// Cadastra as categorias e os produtos que antes ficavam fixos no index.html.
// Não apaga nada: categoria/produto que já existe (mesmo nome) é mantido; do produto
// existente só são atualizados fotos, tons e ícone (preço, estoque e textos ficam).
// ──────────────────────────────────────────────────────────

const DESCRICAO_PADRAO = 'Produto BE YOU de alta qualidade, formulado para realçar sua beleza natural com muito pigmento e durabilidade.'
const ESTOQUE_INICIAL = 30

const categorias = [
    { nome: 'Rosto', descricao: 'Bases, corretivos e pós para uma pele uniforme — do efeito natural ao total cobertura.' },
    { nome: 'Lábios', descricao: 'Batons, glosses e cuidados labiais em tons que vão do nude ao vermelho intenso.' },
    { nome: 'Olhos', descricao: 'Sombras, delineadores e máscaras para um olhar marcante em qualquer ocasião.' },
    { nome: 'Sobrancelhas', descricao: 'Ferramentas de desenho e fixação para sobrancelhas alinhadas o dia todo.' },
    { nome: 'Paletas', descricao: 'Combinações prontas para sombras, contorno e iluminação — praticidade em um único estojo.' }
]

// Tom com nome = variação escolhida pelo cliente; sem nome = cor apenas ilustrativa
const tom = (nome, cor, imagem) => ({ nome, cor, imagem: imagem || null })
const cor = (c) => ({ nome: '', cor: c, imagem: null })
const svg = (conteudo) => `<svg viewBox="0 0 64 64" fill="none" stroke="#c2185f" stroke-width="2">${conteudo}</svg>`

const produtos = [
    // ── ROSTO ──
    {
        categoria: 'Rosto', rotulo: 'BASE', nome: 'Base Segunda Pele FPS 15', preco: 129.90,
        imagens: ['../img_base/base_claro01.png', '../img_base/base_claro02.png', '../img_base/base_medio03.png', '../img_base/base_medio04.png', '../img_base/base_moreno05.png', '../img_base/base_moreno06.png', '../img_base/base_escuro07.png', '../img_base/base_escuro08.png'],
        tons: [
            tom('Claro 01', '#f3d9bd', '../img_base/base_claro01.png'), tom('Claro 02', '#ebc69e', '../img_base/base_claro02.png'),
            tom('Médio 03', '#dcb084', '../img_base/base_medio03.png'), tom('Médio 04', '#c99565', '../img_base/base_medio04.png'),
            tom('Moreno 05', '#b47d51', '../img_base/base_moreno05.png'), tom('Moreno 06', '#99623e', '../img_base/base_moreno06.png'),
            tom('Escuro 07', '#784a30', '../img_base/base_escuro07.png'), tom('Escuro 08', '#553323', '../img_base/base_escuro08.png')
        ]
    },
    {
        categoria: 'Rosto', rotulo: 'BLUSH', nome: 'Blush Compacto Rosé', preco: 49.90, preco_antigo: 59.90,
        imagens: ['../img_blush/blush_rosa.png', '../img_blush/blush_pessego.png', '../img_blush/blush_queimado.png'],
        tons: [tom('Rosa', '#e2909e', '../img_blush/blush_rosa.png'), tom('Pêssego', '#eea07c', '../img_blush/blush_pessego.png'), tom('Queimado', '#b96b58', '../img_blush/blush_queimado.png')]
    },
    {
        categoria: 'Rosto', rotulo: 'PÓ COMPACTO', nome: 'Pó Compacto Matte 12h', preco: 72.00,
        imagens: ['../img_po/po_claro01.png', '../img_po/po_medio02.png'],
        tons: [tom('Claro 01', '#f0d3b0', '../img_po/po_claro01.png'), tom('Médio 02', '#c98f5f', '../img_po/po_medio02.png')]
    },
    {
        categoria: 'Rosto', rotulo: 'CORRETIVO', nome: 'Corretivo Alta Cobertura', preco: 44.90,
        imagens: ['../img_corretivo/corretivo_claro01.png', '../img_corretivo/corretivo_medio02.png', '../img_corretivo/corretivo_moreno03.png', '../img_corretivo/corretivo_escuro04.png'],
        tons: [
            tom('Claro 01', '#f3d9b8', '../img_corretivo/corretivo_claro01.png'), tom('Médio 02', '#dba876', '../img_corretivo/corretivo_medio02.png'),
            tom('Moreno 03', '#ab744b', '../img_corretivo/corretivo_moreno03.png'), tom('Escuro 04', '#70472e', '../img_corretivo/corretivo_escuro04.png')
        ]
    },
    {
        categoria: 'Rosto', rotulo: 'PRIMER', nome: 'Primer Efeito Filtro', preco: 89.90,
        imagens: ['../img_primer/primer-claro.png']
    },

    // ── LÁBIOS ──
    {
        categoria: 'Lábios', rotulo: 'BATOM', nome: 'Batom Velvet Matte', preco: 69.90,
        descricao: 'Fórmula velvet de longa duração que proporciona cobertura total e acabamento aveludado. Hidrata e cuida dos lábios com vitamina E. Até 8 horas de durabilidade.',
        imagens: ['../img_batom/batom_vermelho-claro.png', '../img_batom/batom_rosa-claro.png', '../img_batom/batom_nude-claro.png', '../img_batom/batom_vinho-claro.png', '../img_batom/batom_rosaForte-claro.png'],
        tons: [
            tom('Vermelho Paixão', '#c0455a', '../img_batom/batom_vermelho-claro.png'), tom('Rosa Romântico', '#d98a90', '../img_batom/batom_rosa-claro.png'),
            tom('Nude Natural', '#a85d3a', '../img_batom/batom_nude-claro.png'), tom('Vinho Intenso', '#8c1f2b', '../img_batom/batom_vinho-claro.png'),
            tom('Rosa Forte', '#cf3976', '../img_batom/batom_rosaForte-claro.png')
        ]
    },
    {
        categoria: 'Lábios', rotulo: 'BATOM', nome: 'Batom Líquido Matte', preco: 69.90,
        descricao: 'Batom líquido BE YOU disponível nos tons Vermelho, Rosa Forte e Nude.',
        imagens: ['../img_batom/batom_liquido_vermelho-claro.png', '../img_batom/batom_liquido_rosaForte-claro.png', '../img_batom/batom_liquido_nude-claro.png'],
        tons: [tom('Vermelho', '#bd3545', '../img_batom/batom_liquido_vermelho-claro.png'), tom('Rosa Forte', '#cf3976', '../img_batom/batom_liquido_rosaForte-claro.png'), tom('Nude', '#b5816e', '../img_batom/batom_liquido_nude-claro.png')]
    },
    {
        categoria: 'Lábios', rotulo: 'GLOSS LABIAL', nome: 'Gloss Efeito Vidro', preco: 39.90, preco_antigo: 54.90,
        descricao: 'Gloss labial com efeito espelhado e ultra brilhante. Fórmula não pegajosa enriquecida com óleos naturais que hidratam e volumizam os lábios. Perfeito para usar sozinho ou sobre batom.',
        imagens: ['../img_batom/gloss_BEYOU-claro.png', '../img_batom/gloss_BEYOU2-claro.png', '../img_batom/gloss_dourado-claro.png', '../img_batom/gloss_dourado2-claro.png'],
        tons: [tom('BE YOU Rosa', '#f0c4c9', '../img_batom/gloss_BEYOU-claro.png'), tom('BE YOU Pink', '#e39aa5', '../img_batom/gloss_BEYOU2-claro.png'), tom('Dourado Luxo', '#d4a843', '../img_batom/gloss_dourado-claro.png')]
    },
    {
        categoria: 'Lábios', rotulo: 'LÁPIS DE BOCA', nome: 'Lápis Delineador Labial', preco: 42.00,
        imagens: ['../img_lapis_de_boca/lapis_rosa-claro.png', '../img_lapis_de_boca/lapis_marrom-claro.png'],
        tons: [tom('Rosa', '#cb7b8a', '../img_lapis_de_boca/lapis_rosa-claro.png'), tom('Marrom', '#86533d', '../img_lapis_de_boca/lapis_marrom-claro.png')]
    },
    {
        categoria: 'Lábios', rotulo: 'LIP BALM', nome: 'Lip Balm Hidratante Nude', preco: 34.90,
        imagens: ['../img_batom/balm-claro.png'],
        icone_svg: svg('<ellipse cx="32" cy="24" rx="10" ry="14"/><rect x="27" y="36" width="10" height="18" rx="4"/>')
    },
    {
        categoria: 'Lábios', rotulo: 'PRIMER LABIAL', nome: 'Primer Labial Longa Duração', preco: 79.90,
        imagens: ['../img_batom/primer_labial-claro.png'],
        icone_svg: svg('<rect x="18" y="24" width="28" height="14" rx="7"/><rect x="30" y="14" width="4" height="10"/>')
    },

    // ── OLHOS ──
    {
        categoria: 'Olhos', rotulo: 'MÁSCARA DE CÍLIOS', nome: 'Máscara Volume Extremo', preco: 64.90,
        imagens: ['../img_olhos/mascara-claro.png'],
        icone_svg: svg('<rect x="20" y="10" width="10" height="6" rx="2"/><path d="M25 16v20l-6 18h6l4-14 4 14h6l-6-18V16"/>')
    },
    {
        categoria: 'Olhos', rotulo: 'SOMBRA', nome: 'Trio de Sombras Cintilantes', preco: 58.00,
        imagens: ['../img_olhos/trio-claro.png'],
        tons: [cor('#d4a86a'), cor('#8c6a4e'), cor('#c98f5f')],
        icone_svg: svg('<rect x="10" y="26" width="44" height="14" rx="7"/><circle cx="18" cy="33" r="4"/><circle cx="30" cy="33" r="4"/><circle cx="42" cy="33" r="4"/>')
    },
    {
        categoria: 'Olhos', rotulo: 'DELINEADOR', nome: 'Delineador Líquido Preto Intenso', preco: 36.90, preco_antigo: 46.90,
        imagens: ['../img_olhos/delineador-claro.png'],
        icone_svg: svg('<path d="M14 40q10-22 20-22 6 0 10 8"/><rect x="40" y="12" width="6" height="10" transform="rotate(30 43 17)"/>')
    },
    {
        categoria: 'Olhos', rotulo: 'LÁPIS DE OLHO', nome: 'Lápis Retrátil À Prova d\'Água', preco: 38.00,
        imagens: ['../img_olhos/lapis_olho-claro.png'],
        tons: [cor('#1c1614'), cor('#3a2a20')],
        icone_svg: svg('<rect x="28" y="10" width="8" height="36" rx="4"/><path d="M28 46l4 8 4-8z"/>')
    },
    {
        categoria: 'Olhos', rotulo: 'CÍLIOS POSTIÇOS', nome: 'Cílios Postiços Efeito Fio a Fio', preco: 49.90,
        imagens: ['../img_olhos/cilios-claro.png'],
        icone_svg: svg('<path d="M12 40c6-16 14-24 20-24s14 8 20 24"/><path d="M18 40c2-8 8-14 14-14s12 6 14 14"/>')
    },

    // ── SOBRANCELHAS ──
    {
        categoria: 'Sobrancelhas', rotulo: 'LÁPIS PARA SOBRANCELHA', nome: 'Lápis Efeito Fio a Fio', preco: 42.90,
        imagens: ['../img_sobrancelhas/lapis_sobrancelha-claro.png'],
        tons: [cor('#4a3226'), cor('#2c1e17')],
        icone_svg: svg('<rect x="28" y="10" width="8" height="36" rx="4"/><path d="M28 46l4 8 4-8z"/>')
    },
    {
        categoria: 'Sobrancelhas', rotulo: 'GEL PARA SOBRANCELHA', nome: 'Gel Fixador Transparente', preco: 52.00,
        imagens: ['../img_sobrancelhas/gel-claro.png'],
        icone_svg: svg('<rect x="20" y="24" width="24" height="14" rx="7"/><circle cx="32" cy="31" r="3" fill="#c2185f" stroke="none"/>')
    },
    {
        categoria: 'Sobrancelhas', rotulo: 'SOMBRA EM PÓ', nome: 'Duo de Pó para Sobrancelha', preco: 46.00,
        imagens: ['../img_sobrancelhas/duo_sobrancelha-claro.png'],
        tons: [cor('#6b4a34'), cor('#3a281d')],
        icone_svg: svg('<rect x="20" y="10" width="24" height="16" rx="3"/><circle cx="28" cy="18" r="3"/><circle cx="36" cy="18" r="3"/>')
    },
    {
        categoria: 'Sobrancelhas', rotulo: 'MÁSCARA PARA SOBRANCELHA', nome: 'Máscara Modeladora Tonalizante', preco: 39.90,
        imagens: ['../img_sobrancelhas/mascara_sobrancelha-claro.png'],
        icone_svg: svg('<rect x="24" y="8" width="16" height="8" rx="2"/><path d="M24 16v22a8 8 0 0 0 16 0V16"/>')
    },
    {
        categoria: 'Sobrancelhas', rotulo: 'KIT DE SOBRANCELHA', nome: 'Kit Design Completo', preco: 98.00,
        imagens: ['../img_sobrancelhas/kit-claro.png'],
        icone_svg: svg('<rect x="12" y="18" width="40" height="28" rx="5"/><line x1="32" y1="18" x2="32" y2="46"/><circle cx="22" cy="32" r="4"/><circle cx="42" cy="32" r="4"/>')
    },

    // ── PALETAS ──
    {
        categoria: 'Paletas', rotulo: 'PALETA DE SOMBRA', nome: 'Paleta Nude Editorial · 12 tons', preco: 149.00,
        imagens: ['../img_paletas/nude-claro.png'],
        tons: [cor('#e7c9a5'), cor('#c9986a'), cor('#8c6a4e')],
        icone_svg: svg('<rect x="8" y="16" width="48" height="32" rx="5"/><circle cx="20" cy="32" r="5"/><circle cx="32" cy="32" r="5"/><circle cx="44" cy="32" r="5"/>')
    },
    {
        categoria: 'Paletas', rotulo: 'PALETA DE CONTORNO', nome: 'Duo Contorno & Iluminação', preco: 94.90, preco_antigo: 118.00,
        imagens: ['../img_paletas/contorno-claro.png'],
        icone_svg: svg('<rect x="10" y="20" width="44" height="24" rx="5"/><line x1="32" y1="20" x2="32" y2="44"/>')
    },
    {
        categoria: 'Paletas', rotulo: 'PALETA DE ILUMINADOR', nome: 'Paleta Glow Multitonal', preco: 86.00,
        imagens: ['../img_paletas/glow-claro.png'],
        icone_svg: svg('<rect x="14" y="18" width="36" height="28" rx="14"/><circle cx="32" cy="32" r="6" fill="#c2185f" stroke="none"/>')
    },
    {
        categoria: 'Paletas', rotulo: 'PALETA MULTIFUNCIONAL', nome: 'Paleta Rosto Completo · Face Kit', preco: 169.00,
        imagens: ['../img_paletas/face-claro.png'],
        icone_svg: svg('<rect x="8" y="12" width="48" height="40" rx="5"/><line x1="8" y1="26" x2="56" y2="26"/><line x1="8" y1="39" x2="56" y2="39"/><line x1="24" y1="12" x2="24" y2="52"/><line x1="40" y1="12" x2="40" y2="52"/>')
    },
    {
        categoria: 'Paletas', rotulo: 'PALETA DE SOMBRA', nome: 'Paleta Dupla Sunset', preco: 132.00,
        imagens: ['../img_paletas/sunset-claro.png'],
        tons: [cor('#e08a5c'), cor('#c2185f')],
        icone_svg: svg('<rect x="10" y="16" width="44" height="32" rx="5"/><circle cx="24" cy="32" r="6"/><circle cx="40" cy="32" r="6"/>')
    }
]

// Fotos e nomes das variações completadas no catálogo.
for (const variante of require('./tons.catalogo.json')) {
    const produto = produtos.find(p => p.nome === variante.produto)
    if (produto && produto.tons && produto.tons[variante.index]) {
        produto.tons[variante.index] = { nome: variante.nome, cor: variante.cor, imagem: variante.imagem }
        if (variante.index === 0) produto.imagens = [variante.imagem, ...(produto.imagens || [])]
        else produto.imagens.push(variante.imagem)
    }
}

// História de cada produto (página do produto). Parágrafos separados por linha em branco
const historias = {
    'Base Segunda Pele FPS 15': 'A primeira base da BE YOU nasceu de uma reclamação que ouvíamos todo dia no estúdio: "nenhuma base fica no meu tom". Passamos meses testando pigmentos em peles reais até chegar a oito tonalidades, do Claro 01 ao Escuro 08, com fundo neutro que não acinzenta nem alaranja.\n\nA textura é leve, uniformiza sem pesar e tem FPS 15 para o dia a dia. É a base que a gente usa em noivas e também numa terça-feira qualquer.',
    'Blush Compacto Rosé': 'O Blush Compacto Rosé começou como uma mistura feita à mão para dar aquele corado de quem acabou de chegar da praia em Florianópolis.\n\nO pó é finíssimo, constrói cor aos poucos e não marca a textura da pele. Rosa, Pêssego e Queimado foram escolhidos para funcionar em peles claras, médias e retintas.',
    'Pó Compacto Matte 12h': 'Criado para quem precisa que a maquiagem aguente o dia inteiro, o Pó Compacto Matte segura a oleosidade por até 12 horas sem deixar a pele com aspecto seco.\n\nVem em estojo com espelho, pensado para o retoque na bolsa entre uma reunião e outra.',
    'Corretivo Alta Cobertura': 'Nossos maquiadores queriam um corretivo que cobrisse olheira profunda sem craquelar. O resultado é uma fórmula cremosa, de alta cobertura e acabamento natural.\n\nOs quatro tons acompanham a cartela da Base Segunda Pele, para que corretivo e base conversem no rosto.',
    'Primer Efeito Filtro': 'O Primer Efeito Filtro é o passo que a gente nunca pula. Ele suaviza poros e linhas finas, deixa a pele com aspecto de foto tratada e faz a base durar mais.\n\nPode ser usado sozinho, para um acabamento aveludado, ou por baixo de qualquer base.',
    'Batom Velvet Matte': 'O Velvet Matte é o batom que virou a cara da BE YOU — é ele que aparece na mão da nossa modelo na página inicial. A fórmula aveludada desliza como creme e seca matte, sem repuxar.\n\nCom vitamina E e até 8 horas de duração, foi pensado para atravessar o dia e a festa sem retoque. Os cinco tons vão do Nude Natural ao Vinho Intenso.',
    'Batom Líquido Matte': 'O Batom Líquido Matte nasceu para quem quer cor intensa com uma única passada. O aplicador em formato de gota contorna o lábio com precisão.\n\nSeca em segundos, não transfere para a taça e mantém o conforto mesmo depois de horas.',
    'Gloss Efeito Vidro': 'Inspirado nas tendências de pele iluminada, o Gloss Efeito Vidro dá aos lábios um brilho espelhado sem a sensação pegajosa dos glosses antigos.\n\nÓleos naturais hidratam e dão efeito de volume. Use sozinho para um look fresco ou por cima do batom para transformar o matte em brilho.',
    'Lápis Delineador Labial': 'Todo batom fica melhor com um bom contorno. O Lápis Delineador Labial tem ponta firme para desenhar e textura cremosa para preencher.\n\nRosa e Marrom foram escolhidos para combinar com quase todos os nossos batons e evitar que a cor escape do lábio.',
    'Lip Balm Hidratante Nude': 'O Lip Balm Hidratante Nude é o cuidado que prepara os lábios antes da maquiagem e os recupera depois dela.\n\nA cor nude é translúcida, então ele também funciona como um toque de cor discreto para os dias sem maquiagem.',
    'Primer Labial Longa Duração': 'Desenvolvido para dias longos, o Primer Labial cria uma base lisa que preenche linhas finas e faz o batom durar ainda mais.\n\nÉ incolor e de secagem rápida: aplique, espere alguns segundos e passe seu batom favorito.',
    'Máscara Volume Extremo': 'A Máscara Volume Extremo tem escova de fibras curvas que separa e alonga cada cílio desde a raiz.\n\nA fórmula preta intensa não borra e não forma grumos, para um olhar marcante do café da manhã ao fim da noite.',
    'Trio de Sombras Cintilantes': 'O Trio de Sombras Cintilantes reúne três tons dourados e terrosos que combinam entre si, para quem quer um olhar iluminado sem pensar muito.\n\nO cintilante é fino e fica no lugar: nada de partículas caindo no rosto.',
    'Delineador Líquido Preto Intenso': 'Nosso delineador tem ponta de feltro firme, que facilita do traço fininho ao gatinho marcado.\n\nO preto é intenso desde a primeira passada e a fórmula é resistente à água e ao suor.',
    'Lápis Retrátil À Prova d\'Água': 'O Lápis Retrátil dispensa apontador e tem textura macia para deslizar na linha d\'água sem puxar.\n\nÉ à prova d\'água e fica no lugar o dia inteiro, nos tons preto e marrom.',
    'Cílios Postiços Efeito Fio a Fio': 'Os Cílios Postiços Efeito Fio a Fio foram desenhados para parecer naturais: fios finos e de tamanhos alternados, como os cílios de verdade.\n\nA haste flexível se adapta ao formato do olho e pode ser reutilizada com os devidos cuidados.',
    'Lápis Efeito Fio a Fio': 'Com ponta ultrafina, o Lápis Efeito Fio a Fio desenha pelinhos que imitam os fios naturais da sobrancelha.\n\nA escovinha na outra ponta esfuma e penteia, para um resultado preenchido sem parecer pintado.',
    'Gel Fixador Transparente': 'O Gel Fixador Transparente penteia e mantém os fios no lugar o dia todo, sem deixar resíduo branco.\n\nPode ser usado sozinho, para sobrancelhas naturais, ou por cima do lápis e do pó para selar o desenho.',
    'Duo de Pó para Sobrancelha': 'O Duo de Pó traz dois tons que podem ser usados separados ou misturados até chegar à cor exata dos seus fios.\n\nO efeito é esfumado e natural, ideal para preencher falhas sem marcar.',
    'Máscara Modeladora Tonalizante': 'A Máscara Modeladora Tonalizante dá cor e volume aos fios em uma passada, com escova pequena que alcança até os pelinhos mais curtos.\n\nÉ a escolha para quem quer sobrancelhas definidas em segundos.',
    'Kit Design Completo': 'O Kit Design Completo reúne tudo o que nossos designers de sobrancelha usam no estúdio: pó em dois tons, cera modeladora e pincel duplo.\n\nVem em estojo compacto com espelho, para levar para qualquer lugar.',
    'Paleta Nude Editorial · 12 tons': 'A Paleta Nude Editorial é a queridinha da casa. São 12 tons entre mattes e cintilantes, organizados para montar do look de trabalho ao esfumado da noite.\n\nCada cor foi testada em diferentes tons de pele para garantir pigmento visível em todas.',
    'Duo Contorno & Iluminação': 'O Duo Contorno & Iluminação traz um pó de contorno com fundo frio, que imita a sombra natural do rosto, e um iluminador de brilho acetinado.\n\nÉ o atalho para esculpir o rosto em poucos minutos.',
    'Paleta Glow Multitonal': 'A Paleta Glow Multitonal reúne iluminadores em tons champanhe, rosado e dourado, que podem ser usados separados ou misturados.\n\nO brilho é refinado, sem glitter grosso, e funciona tanto nas maçãs do rosto quanto nos olhos.',
    'Paleta Rosto Completo · Face Kit': 'A Paleta Rosto Completo foi criada para viagens: blush, contorno, iluminador e pó em um único estojo.\n\nTudo o que você precisa para finalizar a maquiagem do rosto, ocupando o espaço de um celular na bolsa.',
    'Paleta Dupla Sunset': 'Inspirada no pôr do sol da Lagoa da Conceição, a Paleta Dupla Sunset combina um laranja queimado e um magenta vibrante.\n\nSão cores que funcionam juntas nos olhos, mas também como blush para um look monocromático.'
}


async function seed() {
    await require('./estrutura')();
    const idsCategoria = {};
    for (const c of categorias) {
        const [categoria] = await Categoria.findOrCreate({ where: { nome: c.nome }, defaults: c });
        idsCategoria[c.nome] = categoria.codCategoria;
    }
    let criados = 0;
    for (const p of produtos) {
        await conn.transaction(async transaction => {
            const existente = await Produto.findOne({ where: { nome: p.nome }, transaction });
            if (existente) return;
            const imagens = p.imagens || [];
            const produto = await Produto.create({
                idCategoria: idsCategoria[p.categoria], nome: p.nome, rotulo: p.rotulo,
                descricao: p.descricao || DESCRICAO_PADRAO, historia: historias[p.nome] || null,
                preco: p.preco, preco_antigo: p.preco_antigo || null,
                imagem_url: imagens[0] || null, imagens, tons: p.tons || [],
                icone_svg: p.icone_svg || null, ativo: true
            }, { transaction });
            await Estoque.create({ idProduto: produto.codProduto, quantidade_atual: ESTOQUE_INICIAL, quantidade_minima: 5 }, { transaction });
            criados++;
        });
    }
    console.log('Catálogo carregado: ' + categorias.length + ' categorias verificadas e ' + criados + ' produtos criados. Cadastros existentes preservados.');
}
module.exports = seed;
if (require.main === module) seed().catch(e => { console.error('Erro ao carregar catálogo:', e.message); process.exitCode = 1; }).finally(() => conn.close());
