const API_CONTA = 'http://localhost:3000/api';
const tokenConta = localStorage.getItem('token');
let usuarioConta = null;
const $ = id => document.getElementById(id);
const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moedaConta = valor => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(Number(valor) || 0);
function dataConta(valor) {
  if (!valor) return 'A confirmar';
  const data = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(valor + 'T12:00:00') : new Date(valor);
  return Number.isNaN(data.getTime()) ? 'A confirmar' : data.toLocaleDateString('pt-BR');
}
const STATUS_CONTA = {PENDENTE_PAGAMENTO:'Aguardando pagamento',PAGO:'Pagamento aprovado',ENVIADO:'Pedido enviado',ENTREGUE:'Pedido entregue',CANCELADO:'Pedido cancelado'};
const ENTREGA_CONTA = {EM_TRANSITO:'Em trânsito',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Entrega concluída',EXTRAVIADO:'Ocorrência na entrega — fale com a loja'};
function sairConta() { localStorage.removeItem('token'); localStorage.removeItem('usuario'); location.replace('index.html'); }
async function apiConta(caminho, opcoes = {}) {
  const response = await fetch(API_CONTA + caminho, {...opcoes,headers:{Authorization:'Bearer '+tokenConta,...opcoes.headers}});
  if (response.status === 401) { sairConta(); throw new Error('Sua sessão expirou. Entre novamente.'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir. Tente novamente.');
  return data;
}
function abrirAbaConta() {
  const aba = ['dados','pedidos','ajuda'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'resumo';
  document.querySelectorAll('.conta-painel').forEach(p => { p.hidden = p.id !== 'painel-' + aba; });
  document.querySelectorAll('[data-aba]').forEach(a => { if (a.dataset.aba === aba) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
}
function preencherConta(user) {
  usuarioConta = user;
  const nomes = user.nome.trim().split(/\s+/);
  $('nomeConta').textContent = user.nome; $('emailConta').textContent = user.email;
  $('primeiroNome').textContent = nomes[0]; $('avatarConta').textContent = (nomes[0][0] + (nomes.length > 1 ? nomes.at(-1)[0] : '')).toUpperCase();
  $('perfilNome').value=user.nome; $('perfilEmail').value=user.email; $('perfilTelefone').value=user.telefone || '';
  const cpf = String(user.cpf || '').replace(/\D/g,'');
  $('perfilCpf').value = cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4') : 'Não informado';
  $('perfilCampos').disabled=false;
}
async function carregarPerfilConta() {
  try { preencherConta(await apiConta('/usuarios/perfil')); }
  catch (e) { $('avisoConta').textContent='Não foi possível carregar seus dados. Atualize a página para tentar novamente.'; $('avisoConta').hidden=false; }
}
function pedidoConta(p, compacto = false) {
  const entrega=p.entregaPedido, cancelado=p.status==='CANCELADO';
  const entregue=!cancelado && (p.status==='ENTREGUE' || entrega?.statusEntrega==='ENTREGUE');
  const status=cancelado?'Pedido cancelado':entregue?'Pedido entregue':STATUS_CONTA[p.status] || 'Em processamento';
  const itens=p.itensPedido || [];
  return `<article class="pedido-card"><header class="pedido-topo"><div><strong>Pedido #${escapar(p.codPedido)}</strong><small>Realizado em ${dataConta(p.dataPedido)}</small></div><span class="pedido-status ${cancelado?'cancelado':entregue?'entregue':''}">${escapar(status)}</span></header>
    <div class="pedido-itens">${itens.slice(0,compacto?2:itens.length).map(i=>`<div class="pedido-item">${i.produtoItem?.imagem_url?`<img src="${escapar(i.produtoItem.imagem_url)}" alt="" loading="lazy">`:''}<div>${i.produtoItem?`<a href="produto.html?id=${encodeURIComponent(i.produtoItem.codProduto)}">${escapar(i.produtoItem.nome)}</a>`:'<strong>Produto indisponível</strong>'}<small>${escapar(i.quantidade)} un. · ${moedaConta(i.precoUnitario)} cada</small></div><span>${moedaConta(i.valorTotalItem ?? Number(i.precoUnitario)*i.quantidade)}</span></div>`).join('')}${compacto && itens.length>2?`<p>+ ${itens.length-2} outro(s) item(ns)</p>`:''}</div>
    <div class="pedido-resumo"><small>${itens.reduce((t,i)=>t+Number(i.quantidade||0),0)} unidade(s) neste pedido</small><strong>${moedaConta(p.valorTotal)}</strong></div>
    ${compacto?'<a class="pedido-acompanhar" href="#pedidos">Acompanhar pedido →</a>':`<details class="pedido-detalhes"><summary>Ver entrega e resumo de valores</summary><div class="pedido-detalhes-corpo"><div><h4>Entrega deste pedido</h4>${cancelado?'<p>Pedido cancelado. Consulte o atendimento em caso de dúvidas.</p>':entrega?`<p>${escapar(ENTREGA_CONTA[entrega.statusEntrega] || 'Aguardando atualização')}</p>${!entregue?`<p>Previsão: ${dataConta(entrega.dataEstimada)}</p>`:''}<address>${escapar(entrega.logradouro)}, ${escapar(entrega.numero)}${entrega.complemento?' · '+escapar(entrega.complemento):''}<br>${escapar(entrega.bairro)} · ${escapar(entrega.localidade)}/${escapar(entrega.uf)}<br>CEP ${escapar(entrega.cep)}</address>${entrega.codigoRastreio?`<div class="pedido-rastreio"><h4>Código de rastreio</h4><code>${escapar(entrega.codigoRastreio)}</code></div>`:'<p>O código de rastreio aparecerá quando for informado pela loja.</p>'}`:'<p>Os dados de entrega ainda não estão disponíveis.</p>'}</div><div><h4>Resumo da compra</h4><dl class="pedido-valores"><div><dt>Produtos</dt><dd>${moedaConta(p.valorSubtotal)}</dd></div><div><dt>Frete</dt><dd>${Number(p.valorFrete)===0?'Grátis':moedaConta(p.valorFrete)}</dd></div><div><dt>Total</dt><dd><strong>${moedaConta(p.valorTotal)}</strong></dd></div></dl><p>Precisa de ajuda? Informe o número deste pedido ao <a class="conta-link" href="#ajuda">atendimento</a>.</p></div></div></details>`}</article>`;
}
async function carregarPedidosConta() {
  $('atualizarPedidos').disabled=true; $('pedidosContainer').setAttribute('aria-busy','true');
  try {
    const pedidos=await apiConta('/pedidos/meus-pedidos');
    $('totalPedidos').textContent=pedidos.length;
    $('andamentoPedidos').textContent=pedidos.filter(p=>!['CANCELADO','ENTREGUE'].includes(p.status) && p.entregaPedido?.statusEntrega!=='ENTREGUE').length;
    $('entreguesPedidos').textContent=pedidos.filter(p=>p.status!=='CANCELADO' && (p.status==='ENTREGUE' || p.entregaPedido?.statusEntrega==='ENTREGUE')).length;
    const vazio='<div class="conta-vazio"><h3>Seu próximo favorito espera por você.</h3><p>Você ainda não tem pedidos. Quando fizer uma compra, os detalhes e a entrega vão aparecer aqui.</p><a class="btn btn-primary" href="index.html#catalogo">Explorar a vitrine ↗</a></div>';
    $('pedidosContainer').innerHTML=pedidos.length?pedidos.map(p=>pedidoConta(p)).join(''):vazio;
    $('ultimoPedido').innerHTML=pedidos.length?pedidoConta(pedidos[0],true):vazio;
  } catch (e) {
    const erro='<div class="conta-vazio"><h3>Não conseguimos buscar seus pedidos.</h3><p>Confira sua conexão e tente novamente.</p><button class="btn btn-ghost" data-repetir-pedidos>Tentar novamente</button></div>';
    $('pedidosContainer').innerHTML=erro; $('ultimoPedido').innerHTML=erro;
    ['totalPedidos','andamentoPedidos','entreguesPedidos'].forEach(id=>{$(id).textContent='—';});
    document.querySelectorAll('[data-repetir-pedidos]').forEach(b=>b.addEventListener('click',carregarPedidosConta));
  } finally { $('atualizarPedidos').disabled=false; $('pedidosContainer').setAttribute('aria-busy','false'); }
}
async function salvarConta(e) {
  e.preventDefault(); if (!usuarioConta) return;
  const msg=$('msgPerfil'); msg.className='';
  const senha=$('perfilSenha').value, confirmar=$('perfilConfirmar').value;
  if (senha!==confirmar) { msg.textContent='As senhas precisam ser iguais.'; msg.className='erro'; $('perfilConfirmar').focus(); return; }
  const dados={nome:$('perfilNome').value.trim(),email:$('perfilEmail').value.trim(),telefone:$('perfilTelefone').value.trim()};
  if (!dados.nome || !dados.email || !dados.telefone) { msg.textContent='Preencha nome, e-mail e telefone.'; msg.className='erro'; return; }
  if (senha) dados.senha=senha;
  $('salvarPerfil').disabled=true; $('salvarPerfil').textContent='Salvando...';
  try {
    await apiConta('/usuarios/'+usuarioConta.codUsuario,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)});
    const {senha:ignorar,...publico}=dados; preencherConta({...usuarioConta,...publico});
    localStorage.setItem('usuario',JSON.stringify(usuarioConta));
    $('perfilSenha').value=''; $('perfilConfirmar').value=''; msg.textContent='Suas alterações foram salvas.'; msg.className='sucesso';
  } catch (e) { msg.textContent=e.message; msg.className='erro'; }
  finally { $('salvarPerfil').disabled=false; $('salvarPerfil').textContent='Salvar alterações'; }
}
async function carregarContatoConta() {
  try {
    const r=await fetch(API_CONTA+'/conteudos'); if (!r.ok) return;
    const c=await r.json(), numero=String(c.rede_whatsapp||'').replace(/\D/g,'');
    if (/^55[1-9]{2}\d{8,9}$/.test(numero)) { $('contatoConta').href='https://wa.me/'+numero; $('contatoConta').target='_blank'; $('contatoConta').rel='noopener noreferrer'; $('contatoConta').textContent='Conversar no WhatsApp ↗'; }
  } catch (e) { /* O link de contato da loja continua disponível. */ }
}
if (!tokenConta) location.replace('index.html');
else {
  $('sairConta').addEventListener('click',sairConta); $('formPerfil').addEventListener('submit',salvarConta); $('atualizarPedidos').addEventListener('click',carregarPedidosConta);
  window.addEventListener('hashchange',abrirAbaConta);
  abrirAbaConta(); carregarPerfilConta(); carregarPedidosConta(); carregarContatoConta();
}
