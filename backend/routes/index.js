const express = require('express')
const router = express.Router()

// Middlewares
const auth = require('../middleware/auth')
const isAdmin = require('../middleware/isAdmin')

// Controllers
const authCtrl = require('../controller/auth.controller')
const usuarioCtrl = require('../controller/usuario.controller')
const categoriaCtrl = require('../controller/categoria.controller')
const produtoCtrl = require('../controller/produto.controller')
const estoqueCtrl = require('../controller/estoque.controller')
const pedidoCtrl = require('../controller/pedido.controller')
const entregaCtrl = require('../controller/entrega.controller')
const relatorioCtrl = require('../controller/relatorio.controller')
const conteudoCtrl = require('../controller/conteudo.controller')
const imagemCtrl = require('../controller/imagem.controller')

// Upload binário: autenticar antes de receber até 5 MB por imagem.
router.post('/admin/imagens', auth, isAdmin, (req, res, next) => {
    express.raw({ type: 'application/octet-stream', limit: '5mb' })(req, res, err => {
        if (err) return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ erro: 'A imagem deve ter no máximo 5 MB.' })
        next()
    })
}, imagemCtrl.enviar)

// ══════════════════════════════════════════════════
// ROTAS PÚBLICAS (sem autenticação)
// ══════════════════════════════════════════════════

// Autenticação — a loja e o painel têm logins separados
router.post('/login', authCtrl.login)              // só CLIENTE
router.post('/admin/login', authCtrl.loginAdmin)   // só ADMIN

// Usuários — apenas cadastro é público
router.post('/usuarios', usuarioCtrl.cadastrar)

// Categorias — listagem pública
router.get('/categorias', categoriaCtrl.listar)
router.get('/categorias/buscar', categoriaCtrl.buscarPorNome)
router.get('/categorias/:id', categoriaCtrl.buscarPorId)

// Produtos — leitura pública
router.get('/produtos', produtoCtrl.listar)
router.get('/produtos/buscar', produtoCtrl.buscar)
// Rota literal de admin declarada antes de /produtos/:id para não ser capturada por ela
router.get('/produtos/todos', auth, isAdmin, produtoCtrl.listarTodos)
router.get('/produtos/:id', produtoCtrl.buscarPorId)

// Conteúdo do site (textos e imagens da página inicial) — leitura pública
router.get('/conteudos', conteudoCtrl.listar)

// ══════════════════════════════════════════════════
// ROTAS PRIVADAS — usuário autenticado
// ══════════════════════════════════════════════════

// Perfil do usuário logado
router.get('/usuarios/perfil', auth, usuarioCtrl.perfil)
router.put('/usuarios/:id', auth, usuarioCtrl.atualizar)
router.patch('/usuarios/:id', auth, usuarioCtrl.atualizarParcial)

// Pedidos — cliente logado
router.post('/pedidos', auth, pedidoCtrl.criarPedido)
router.get('/pedidos/meus-pedidos', auth, pedidoCtrl.meusPedidos)

// ══════════════════════════════════════════════════
// ROTAS PRIVADAS — apenas ADMIN
// ══════════════════════════════════════════════════

// Usuários (admin) — administradores só são cadastrados por outro administrador
router.post('/admin/usuarios', auth, isAdmin, usuarioCtrl.cadastrarAdmin)
router.get('/usuarios', auth, isAdmin, usuarioCtrl.listar)
router.get('/usuarios/buscar', auth, isAdmin, usuarioCtrl.listar)
router.get('/usuarios/:id', auth, isAdmin, usuarioCtrl.buscarPorId)
router.delete('/usuarios/:id', auth, isAdmin, usuarioCtrl.deletar)

// Categorias (admin)
router.post('/categorias', auth, isAdmin, categoriaCtrl.criar)
router.put('/categorias/:id', auth, isAdmin, categoriaCtrl.atualizar)
router.patch('/categorias/:id', auth, isAdmin, categoriaCtrl.atualizarParcial)
router.delete('/categorias/:id', auth, isAdmin, categoriaCtrl.deletar)

// Produtos (admin) — GET /produtos/todos fica junto das rotas públicas, antes de /produtos/:id
router.post('/produtos', auth, isAdmin, produtoCtrl.criar)
router.put('/produtos/:id', auth, isAdmin, produtoCtrl.atualizar)
router.patch('/produtos/:id', auth, isAdmin, produtoCtrl.atualizarParcial)
router.delete('/produtos/:id', auth, isAdmin, produtoCtrl.deletar)

// Estoque (admin)
router.get('/estoque', auth, isAdmin, estoqueCtrl.listar)
router.get('/estoque/:id', auth, isAdmin, estoqueCtrl.buscarPorId)
router.post('/estoque', auth, isAdmin, estoqueCtrl.movimentar)
router.put('/estoque/:id', auth, isAdmin, estoqueCtrl.atualizar)
router.patch('/estoque/:id', auth, isAdmin, estoqueCtrl.atualizarParcial)

// Pedidos (admin)
router.get('/pedidos', auth, isAdmin, pedidoCtrl.listarTodos)
router.patch('/pedidos/:id/status', auth, isAdmin, pedidoCtrl.atualizarStatus)

// Entregas (admin)
router.get('/entregas', auth, isAdmin, entregaCtrl.listar)
router.get('/entregas/:id', auth, isAdmin, entregaCtrl.buscarPorId)
router.put('/entregas/:id', auth, isAdmin, entregaCtrl.atualizar)
router.patch('/entregas/:id', auth, isAdmin, entregaCtrl.atualizarParcial)

// Relatórios (admin)
router.get('/relatorios/vendas', auth, isAdmin, relatorioCtrl.vendasPorCategoria)
router.get('/relatorios/faturamento', auth, isAdmin, relatorioCtrl.faturamentoMensal)
router.get('/relatorios/estoque', auth, isAdmin, relatorioCtrl.resumoEstoque)

// Conteúdo do site (admin)
router.put('/conteudos', auth, isAdmin, conteudoCtrl.atualizar)

module.exports = router
