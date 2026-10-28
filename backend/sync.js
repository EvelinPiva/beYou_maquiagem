const db=require('./db/conn');
require('./estrutura')().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
