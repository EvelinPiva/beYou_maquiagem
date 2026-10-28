const { Op } = require('sequelize');
const ENDERECO = ['cep','logradouro','numero','complemento','bairro','localidade','uf'];
function erro(status,mensagem) { const e=new Error(mensagem);e.status=status;return e; }
function inteiro(v,min=0) { return (typeof v==='number'||typeof v==='string'&&v.trim()!=='') && Number.isSafeInteger(Number(v)) && Number(v)>=min && Number(v)<=2147483647; }
function validarEndereco(dados) {
 const limites={cep:9,logradouro:70,numero:12,complemento:100,bairro:70,localidade:70,uf:2};
 const e={};for(const c of ENDERECO) { const v=dados?.[c]; if(v!==undefined&&v!==null&&typeof v!=='string')throw erro(400,'Endere?o inv?lido: '+c); e[c]=(v||'').trim();if(e[c].length>limites[c])throw erro(400,'Campo de endere?o muito longo: '+c); }
 e.cep=e.cep.replace(/\D/g,'');e.uf=e.uf.toUpperCase();
 if(!/^\d{8}$/.test(e.cep)||!['logradouro','numero','bairro','localidade'].every(c=>e[c])||!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(e.uf))throw erro(400,'Informe o endere?o completo: CEP, rua, n?mero, bairro, cidade e UF.');
 return e;
}
function cpfValido(valor) {
 const cpf=String(valor??'').replace(/\D/g,'');if(!/^\d{11}$/.test(cpf)||/^(\d)\1+$/.test(cpf))return false;
 for(let n=9;n<=10;n++){let soma=0;for(let i=0;i<n;i++)soma+=Number(cpf[i])*(n+1-i);if((soma*10)%11%10!==Number(cpf[n]))return false;}return true;
}
function responderErro(res,e) {
 if(e.status)return res.status(e.status).json({erro:e.message});
 if(e.name==='SequelizeUniqueConstraintError')return res.status(409).json({erro:'J? existe um cadastro com esses dados.'});
 if(e.name==='SequelizeValidationError')return res.status(400).json({erro:'Dados inv?lidos. Confira os campos informados.'});
 if(e.original?.code==='ER_LOCK_DEADLOCK')return res.status(409).json({erro:'Outra opera??o alterou o estoque. Tente novamente.'});
 console.error(e.message);return res.status(500).json({erro:'Erro interno no servidor.'});
}
module.exports={ENDERECO,erro,inteiro,validarEndereco,cpfValido,responderErro,Op};
