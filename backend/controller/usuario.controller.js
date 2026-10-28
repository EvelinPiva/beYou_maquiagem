const bcrypt=require('bcryptjs');
const {Usuario}=require('../models/rel');
const {ENDERECO,erro,validarEndereco,cpfValido,responderErro,Op}=require('../validacoes');
async function preparar(body,usuario,tipo) {
 const dados={};
 for(const c of ['nome','email','senha','telefone','cpf','identidade'])if(body[c]!==undefined){if(typeof body[c]!=='string')throw erro(400,'Campo inv?lido: '+c);dados[c]=c==='senha'?body[c]:body[c].trim();}
 for(const c of ['nome','email','telefone','cpf'])if(c in dados&&!dados[c])throw erro(400,'Campo obrigat?rio: '+c);
 if(dados.nome&&dados.nome.length>80)throw erro(400,'Nome muito longo.');
 if(dados.telefone&&dados.telefone.length>20)throw erro(400,'Telefone muito longo.');
 if(dados.email){dados.email=dados.email.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)||dados.email.length>100)throw erro(400,'E-mail inv?lido.');}
 if('cpf' in dados){if(!cpfValido(dados.cpf))throw erro(400,'CPF inv?lido.');dados.cpf=dados.cpf.replace(/\D/g,'');}
 if('senha' in dados){if(dados.senha.length<6||Buffer.byteLength(dados.senha)>72)throw erro(400,'Use uma senha entre 6 caracteres e 72 bytes.');dados.senha=await bcrypt.hash(dados.senha,Number(process.env.BCRYPT_SALT_ROUNDS)||10);}
 const termos=[];if(dados.email)termos.push({email:dados.email});if(dados.cpf)termos.push({cpf:dados.cpf});
 if(termos.length){const where={[Op.or]:termos};if(usuario)where.codUsuario={[Op.ne]:usuario.codUsuario};if(await Usuario.findOne({where}))throw erro(409,'E-mail ou CPF j? cadastrado.');}
 if((!usuario&&tipo==='CLIENTE')||body.endereco!==undefined||ENDERECO.some(c=>body[c]!==undefined)){
  const anterior=usuario?Object.fromEntries(ENDERECO.map(c=>[c,usuario[c]])):{};
  Object.assign(dados,validarEndereco({...anterior,...(body.endereco||body)}));
 }
 return dados;
}
async function criar(req,res,tipo){try{
 for(const c of ['nome','email','senha','telefone','cpf'])if(!req.body[c])throw erro(400,'Campos obrigat?rios: nome, e-mail, senha, telefone e CPF.');
 const dados=await preparar(req.body,null,tipo);const u=await Usuario.create({...dados,tipo_usuario:tipo});
 return res.status(201).json({mensagem:'Cadastro realizado com sucesso!',usuario:{codUsuario:u.codUsuario,nome:u.nome,email:u.email,tipo_usuario:u.tipo_usuario}});
}catch(e){return responderErro(res,e);}}
const cadastrar=(req,res)=>criar(req,res,'CLIENTE');const cadastrarAdmin=(req,res)=>criar(req,res,'ADMIN');
async function listar(req,res){try{const where={};if(req.query.nome)where.nome={[Op.like]:'%'+req.query.nome+'%'};return res.json(await Usuario.findAll({where,attributes:{exclude:['senha']},order:[['nome','ASC']]}));}catch(e){return responderErro(res,e);}}
async function buscarPorId(req,res){try{const u=await Usuario.findByPk(req.params.id,{attributes:{exclude:['senha']}});if(!u)throw erro(404,'Usu?rio n?o encontrado.');return res.json(u);}catch(e){return responderErro(res,e);}}
const perfil=(req,res)=>buscarPorId({...req,params:{id:req.usuario.codUsuario}},res);
async function salvar(req,res,completo){try{
 if(req.usuario.tipo_usuario!=='ADMIN'&&req.usuario.codUsuario!==Number(req.params.id))throw erro(403,'Voc? n?o pode alterar este usu?rio.');
 const u=await Usuario.findByPk(req.params.id);if(!u)throw erro(404,'Usu?rio n?o encontrado.');
 if(completo)for(const c of ['nome','email','telefone'])if(!req.body[c])throw erro(400,'Informe nome, e-mail e telefone.');
 const dados=await preparar(req.body,u,u.tipo_usuario);if(!Object.keys(dados).length)throw erro(400,'Informe ao menos um campo cadastral.');
 await u.update(dados);return res.json({mensagem:'Dados atualizados com sucesso!'});
}catch(e){return responderErro(res,e);}}
const atualizar=(req,res)=>salvar(req,res,true);const atualizarParcial=(req,res)=>salvar(req,res,false);
async function deletar(req,res){try{const u=await Usuario.findByPk(req.params.id);if(!u)throw erro(404,'Usu?rio n?o encontrado.');if(u.codUsuario===req.usuario.codUsuario)throw erro(400,'Voc? n?o pode remover sua pr?pria conta.');await u.destroy();return res.json({mensagem:'Usu?rio removido.'});}catch(e){return responderErro(res,e);}}
module.exports={cadastrar,cadastrarAdmin,listar,perfil,buscarPorId,atualizar,atualizarParcial,deletar};
