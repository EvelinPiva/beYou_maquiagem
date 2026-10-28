require('dotenv').config({path:require('path').join(__dirname,'.env')});
const readline=require('node:readline/promises'),bcrypt=require('bcryptjs'),crypto=require('crypto');
const db=require('./db/conn');const {Usuario}=require('./models/rel');const {cpfValido}=require('./validacoes');
(async()=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout});try{
 const email=(process.env.ADMIN_EMAIL||await rl.question('E-mail do administrador: ')).trim().toLowerCase();
 const cpf=(process.env.ADMIN_CPF||await rl.question('CPF v?lido do administrador: ')).replace(/\D/g,'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!cpfValido(cpf))throw Error('E-mail ou CPF inv?lido.');
 if(await Usuario.findOne({where:{email}}))throw Error('Este e-mail j? existe. Nenhuma conta foi alterada.');
 const senha=process.env.ADMIN_SENHA||crypto.randomBytes(12).toString('base64url');if(senha.length<6||Buffer.byteLength(senha)>72)throw Error('Senha inv?lida.');
 await Usuario.create({nome:process.env.ADMIN_NOME||'Administrador BE YOU',email,cpf,telefone:process.env.ADMIN_TELEFONE||'00000000000',senha:await bcrypt.hash(senha,10),tipo_usuario:'ADMIN'});
 const texto='Acesso ao painel local BE YOU\nURL: http://localhost:'+(process.env.PORT||3000)+'/admin\nE-mail: '+email+'\nSenha: '+senha+'\n';
 require('fs').writeFileSync(require('path').join(__dirname,'acesso-local.txt'),texto,{mode:0o600});console.log('Administrador criado. Os dados de acesso est?o em backend/acesso-local.txt (arquivo local, exclu?do da entrega).');
}catch(e){console.error(e.message);process.exitCode=1;}finally{rl.close();await db.close();}})();
