const db=require('../db/conn');
const {Estoque,Produto}=require('../models/rel');
const {erro,inteiro,responderErro}=require('../validacoes');
async function listar(req,res){try{const include={model:Produto,as:'produtoEstoque',attributes:['codProduto','nome','preco']};if(req.query.nome){const {Op}=require('sequelize');include.where={nome:{[Op.like]:'%'+req.query.nome+'%'}};}return res.json(await Estoque.findAll({include:[include],order:[['codEstoque','ASC']]}));}catch(e){return responderErro(res,e);}}
async function buscarPorId(req,res){try{const e=await Estoque.findByPk(req.params.id,{include:[{model:Produto,as:'produtoEstoque'}]});if(!e)throw erro(404,'Estoque n?o encontrado.');return res.json(e);}catch(e){return responderErro(res,e);}}
async function movimentar(req,res){try{
 const {idProduto,quantidade,quantidade_minima}=req.body;const tipo=req.body.tipo||'ENTRADA';
 if(!inteiro(idProduto,1)||!inteiro(quantidade,1)||!['ENTRADA','SAIDA'].includes(tipo))throw erro(400,'Informe produto, quantidade inteira positiva e tipo ENTRADA ou SAIDA.');
 if(quantidade_minima!==undefined&&!inteiro(quantidade_minima))throw erro(400,'Quantidade m?nima inv?lida.');
 const estoque=await db.transaction(async transaction=>{
  const produto=await Produto.findByPk(idProduto,{transaction,lock:transaction.LOCK.UPDATE});if(!produto)throw erro(404,'Produto n?o encontrado.');
  let est=await Estoque.findOne({where:{idProduto},transaction,lock:transaction.LOCK.UPDATE});
  if(!est)est=await Estoque.create({idProduto,quantidade_atual:0,quantidade_minima:quantidade_minima??5},{transaction});
  const total=Number(est.quantidade_atual)+(tipo==='SAIDA'?-Number(quantidade):Number(quantidade));if(!inteiro(total))throw erro(400,'Quantidade insuficiente ou fora do limite permitido.');
  await est.update({quantidade_atual:total,...(quantidade_minima!==undefined?{quantidade_minima:Number(quantidade_minima)}:{})},{transaction});return est;
 });return res.json({mensagem:'Estoque atualizado!',estoque});
}catch(e){return responderErro(res,e);}}
async function salvar(req,res){try{
 const campos={};for(const c of ['quantidade_atual','quantidade_minima'])if(req.body[c]!==undefined){if(!inteiro(req.body[c]))throw erro(400,'As quantidades devem ser inteiras e n?o negativas.');campos[c]=Number(req.body[c]);}
 if(!Object.keys(campos).length)throw erro(400,'Informe quantidade_atual ou quantidade_minima.');
 await db.transaction(async transaction=>{const est=await Estoque.findByPk(req.params.id,{transaction,lock:transaction.LOCK.UPDATE});if(!est)throw erro(404,'Estoque n?o encontrado.');await est.update(campos,{transaction});});return res.json({mensagem:'Estoque atualizado!'});
}catch(e){return responderErro(res,e);}}
module.exports={listar,buscarPorId,movimentar,atualizar:salvar,atualizarParcial:salvar};
