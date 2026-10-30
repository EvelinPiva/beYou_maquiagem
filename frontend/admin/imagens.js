// Arquivos selecionados são enviados ao backend; só o caminho salvo fica no formulário.
async function enviarImagem(file) {
  if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Escolha uma imagem PNG, JPG ou WebP.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Cada imagem deve ter no máximo 5 MB.');
  const response = await fetch(API + '/admin/imagens', {method:'POST',headers:{'Content-Type':'application/octet-stream',Authorization:`Bearer ${sessao.token}`},body:file});
  const data = await response.json().catch(()=>({}));
  if (response.status === 401 || response.status === 403) encerrarSessao('Entre novamente para enviar imagens.');
  if (!response.ok) throw new Error(data.erro || 'Não foi possível enviar a imagem.');
  return new URL(data.url, API).href;
}
async function executarUpload(input, callback) {
  const files = Array.from(input.files || []); if (!files.length) return;
  const form = input.closest('form');
  form.dataset.uploads = Number(form.dataset.uploads || 0) + 1;
  if (input.nextElementSibling?.classList.contains('upload-status')) input.nextElementSibling.remove();
  const status = document.createElement('small'); status.className='upload-status'; status.setAttribute('role','status'); status.textContent='Enviando imagem...'; input.after(status);
  input.disabled=true;
  form.querySelectorAll('[type="submit"]').forEach(b=>{b.disabled=true;});
  try { await callback(files); status.textContent='Imagem enviada. Salve as alterações para aplicar na loja.'; }
  catch (e) { status.textContent=e.message; avisar(e.message,'erro'); }
  finally {
    input.disabled=false; input.value='';
    form.dataset.uploads = Math.max(0,Number(form.dataset.uploads)-1);
    form.querySelectorAll('[type="submit"]').forEach(b=>{b.disabled=Number(form.dataset.uploads)>0;});
  }
}
let tonsEditor = [];
function sincronizarEditorTons() {
  document.getElementById('fpTons').value = tonsParaTexto(tonsEditor);
  atualizarPrevia();
}
function desenharEditorTons(tons) {
  tonsEditor = tons.map(t=>({...t}));
  const root=document.getElementById('fpEditorTons'); root.replaceChildren();
  tonsEditor.forEach((tom,index)=>{
    const row=document.createElement('div'); row.className='upload-tom';
    let cor=tom.cor || '#c98f5f'; if(/^#[a-f\d]{3}$/i.test(cor)) cor='#'+[...cor.slice(1)].map(c=>c+c).join('');
    row.innerHTML=`<div class="upload-tom-campos"><label>Nome do tom<input class="upload-nome-tom" value="${esc(tom.nome || '')}" maxlength="80" placeholder="Ex.: Rosa"></label><label>Cor<input type="color" class="upload-cor-tom" value="${esc(cor)}"></label><button type="button" class="botao botao-claro upload-remover-tom">Remover tom</button></div><label>Foto deste tom<input type="file" accept="image/png,image/jpeg,image/webp"></label><img class="imagem-previa" alt="Prévia do tom" ${tom.imagem?`src="${esc(caminhoImg(tom.imagem))}"`:'hidden'}><button type="button" class="conta-remover-foto botao botao-claro" ${tom.imagem?'':'hidden'}>Remover foto do tom</button>`;
    row.querySelector('.upload-nome-tom').addEventListener('input',e=>{tom.nome=e.target.value.replace(/[|\r\n]/g,' ');sincronizarEditorTons();});
    row.querySelector('.upload-cor-tom').addEventListener('input',e=>{tom.cor=e.target.value;sincronizarEditorTons();});
    // A linha usa o mesmo objeto que a lista serializada.
    tonsEditor[index]=tom;
    row.querySelector('.upload-remover-tom').addEventListener('click',()=>{if(Number(row.closest('form').dataset.uploads||0))return;desenharEditorTons(tonsEditor.filter((_,i)=>i!==index));sincronizarEditorTons();});
    const img=row.querySelector('img'), remover=row.querySelector('.conta-remover-foto');
    remover.addEventListener('click',()=>{tom.imagem=null;img.hidden=true;img.removeAttribute('src');remover.hidden=true;sincronizarEditorTons();});
    const file=row.querySelector('[type="file"]');
    file.addEventListener('change',()=>executarUpload(file,async files=>{tom.imagem=await enviarImagem(files[0]);img.src=tom.imagem;img.hidden=false;remover.hidden=false;sincronizarEditorTons();}));
    root.appendChild(row);
  });
}
document.getElementById('fpAdicionarTom').addEventListener('click',()=>{
  if(Number(document.getElementById('formProduto').dataset.uploads||0))return;
  desenharEditorTons([...tonsEditor,{nome:'',cor:'#c98f5f',imagem:null}]);sincronizarEditorTons();
});
const fotosInput=document.getElementById('fpFotosArquivo');
fotosInput.addEventListener('change',()=>executarUpload(fotosInput,async files=>{
  for(const file of files){
    const url=await enviarImagem(file), campo=document.getElementById('fpImagens');
    campo.value=[...linhasParaLista(campo.value),url].join('\n');atualizarPrevia();
  }
}));
document.getElementById('fpImagensPrevia').addEventListener('click',e=>{
  if(Number(document.getElementById('formProduto').dataset.uploads||0))return;
  const remover=e.target.closest('[data-remover-foto]'),principal=e.target.closest('[data-principal]');
  if(!remover && !principal)return;
  const campo=document.getElementById('fpImagens'),fotos=linhasParaLista(campo.value);
  if(remover)fotos.splice(Number(remover.dataset.removerFoto),1);
  else fotos.unshift(...fotos.splice(Number(principal.dataset.principal),1));
  campo.value=fotos.join('\n');atualizarPrevia();
});
