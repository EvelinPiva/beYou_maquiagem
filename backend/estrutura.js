const db=require('./db/conn');
const modelos=require('./models/rel');
async function prepararEstrutura(){
 await db.authenticate();await db.sync();
 const qi=db.getQueryInterface();
 for(const model of Object.values(modelos)){
  const tabela=model.getTableName(),colunas=await qi.describeTable(tabela);
  for(const [nome,attr] of Object.entries(model.getAttributes()))if(!colunas[attr.field||nome])await qi.addColumn(tabela,attr.field||nome,attr);
 }
 console.log('tabelas sincronizadas com sucesso');
}
module.exports=prepararEstrutura;
