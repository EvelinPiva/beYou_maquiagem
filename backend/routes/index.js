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

// ══════════════════════════════════════════════════
// ROTAS PÚBLICAS (sem autenticação)
// ══════════════════════════════════════════════════

// Autenticação
router.post('/login', authCtrl.login)

// Usuários — apenas cadastro é público
router.post('/usuarios', usuarioCtrl.cadastrar)

// Categorias — listagem pública
router.get('/categorias', categoriaCtrl.listar)
router.get('/categorias/buscar', categoriaCtrl.buscarPorNome)
router.get('/categorias/:id', categoriaCtrl.buscarPorId)

// Produtos — leitura pública
router.get('/produtos', produtoCtrl.listar)
router.get('/produtos/buscar', produtoCtrl.buscar)
router.get('/produtos/:id', produtoCtrl.buscarPorId)

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

// Usuários (admin)
router.get('/usuarios', auth, isAdmin, usuarioCtrl.listar)
router.get('/usuarios/:id', auth, isAdmin, usuarioCtrl.buscarPorId)
router.delete('/usuarios/:id', auth, isAdmin, usuarioCtrl.deletar)

// Categorias (admin)
router.post('/categorias', auth, isAdmin, categoriaCtrl.criar)
router.put('/categorias/:id', auth, isAdmin, categoriaCtrl.atualizar)
router.patch('/categorias/:id', auth, isAdmin, categoriaCtrl.atualizarParcial)
router.delete('/categorias/:id', auth, isAdmin, categoriaCtrl.deletar)

// Produtos (admin)
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

module.exports = router
