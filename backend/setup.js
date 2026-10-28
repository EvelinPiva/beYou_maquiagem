const fs=require('fs'),path=require('path'),crypto=require('crypto');
const env=path.join(__dirname,'.env');
if(!fs.existsSync(env))fs.writeFileSync(env,'DB_NAME=db_ecommerce\nDB_USER=root\nDB_PASS=\nDB_HOST=localhost\nDB_PORT=3306\nPORT=3000\nJWT_SECRET='+crypto.randomBytes(48).toString('hex')+'\nJWT_EXPIRES_IN=3h\n');
require('dotenv').config({path:env});
const mysql=require('mysql2/promise');
async function setup(){
 const config=process.env.MYSQL_URL?new URL(process.env.MYSQL_URL):null;
 const nome=config?decodeURIComponent(config.pathname.slice(1)):(process.env.DB_NAME||'db_ecommerce');
 const c=await mysql.createConnection(config?{host:config.hostname,port:Number(config.port)||3306,user:decodeURIComponent(config.username),password:decodeURIComponent(config.password)}:{host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASS??''});
 try{await c.query('CREATE DATABASE IF NOT EXISTS '+c.escapeId(nome)+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');}finally{await c.end();}
 const db=require('./db/conn');try{await require('./estrutura')();await require('./seed')();console.log('Banco: '+nome+'\nLoja: http://localhost:'+(process.env.PORT||3000)+'\nPara criar acesso ao painel: npm run admin');}finally{await db.close();}
}
setup().catch(e=>{console.error('N?o foi poss?vel preparar o banco: '+e.message+'\nConfira DB_USER e DB_PASS no arquivo backend/.env e se o MySQL est? ligado.');process.exitCode=1;});
