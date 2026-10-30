const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  initZoomProdutos();
  initMobileMenu();
  initModals();
  initCart();
  initFavoritos();
  initAuth();
  initBusca();
  initNewsletter();
  initConteudo();
  initCatalogo();
  initPromocoes();
  initProdutoPagina();
  initPaginaInstitucional();
});

/* ==========================================
   HELPERS
   ========================================== */
// Escapa texto vindo do banco antes de montar HTML com template strings
function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarPreco(valor) {
  return 'R$ ' + parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function urlProduto(produto) {
  return `produto.html?id=${encodeURIComponent(produto.codProduto)}`;
}

function estoqueDe(produto) {
  return produto.estoqueProduto ? Number(produto.estoqueProduto.quantidade_atual) : 0;
}

function descontoDe(produto) {
  const atual = parseFloat(produto.preco);
  const antigo = parseFloat(produto.preco_antigo);
  if (!antigo || antigo <= atual) return 0;
  return Math.round((1 - atual / antigo) * 100);
}

// Produtos com várias cores sempre permitem escolher um tom.
function tonsEscolhiveis(produto) {
  const tons = produto.tons || [];
  return tons.length > 1 ? tons.map((t, i) => ({...t, nome: t.nome || `Tom ${i + 1}`})) : tons.filter(t => t.nome);
}

// Ícone SVG do produto (já validado no backend: só <svg>, sem scripts)
function iconeProduto(produto) {
  const svg = String(produto.icone_svg || '').trim();
  if (/^<svg[\s>]/i.test(svg)) return svg;
  return '<svg viewBox="0 0 64 64" fill="none" stroke="#c2185f" stroke-width="2"><rect x="20" y="14" width="24" height="36" rx="4"/></svg>';
}

// "texto com *destaque*" → nós de texto + <em>, sem usar innerHTML
function preencherComDestaque(el, texto) {
  el.textContent = '';
  String(texto).split(/(\*[^*]+\*)/).forEach(parte => {
    if (!parte) return;
    if (/^\*[^*]+\*$/.test(parte)) {
      const em = document.createElement('em');
      em.textContent = parte.slice(1, -1);
      el.appendChild(em);
    } else {
      el.appendChild(document.createTextNode(parte));
    }
  });
}

// Formato simples dos textos longos: "## " subtítulo, "- " item, linha em branco = parágrafo
function renderizarTexto(container, texto) {
  container.textContent = '';
  let paragrafo = null;
  let lista = null;
  String(texto || '').split(/\r?\n/).forEach(linhaBruta => {
    const linha = linhaBruta.trim();
    if (!linha) { paragrafo = null; lista = null; return; }
    if (linha.startsWith('## ')) {
      paragrafo = null; lista = null;
      const h = document.createElement('h2');
      preencherComDestaque(h, linha.slice(3));
      container.appendChild(h);
    } else if (linha.startsWith('- ')) {
      paragrafo = null;
      if (!lista) { lista = document.createElement('ul'); container.appendChild(lista); }
      const li = document.createElement('li');
      preencherComDestaque(li, linha.slice(2));
      lista.appendChild(li);
    } else {
      lista = null;
      if (paragrafo) {
        paragrafo.appendChild(document.createElement('br'));
      } else {
        paragrafo = document.createElement('p');
        container.appendChild(paragrafo);
      }
      const span = document.createElement('span');
      preencherComDestaque(span, linha);
      paragrafo.appendChild(span);
    }
  });
}

async function apiGet(caminho) {
  const res = await fetch(`${API_BASE}${caminho}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao consultar a API.');
  return data;
}

async function initPromocoes() {
  const grid = document.getElementById('ofertasGrid');
  if (!grid) return;
  const selo = document.getElementById('ofertasSelo');
  const vazio = document.getElementById('ofertasVazio');
  grid.setAttribute('aria-busy', 'true');
  selo.hidden = true;
  vazio.hidden = true;
  try {
    const produtos = await apiGet('/produtos');
    const ofertas = produtos.filter(p => p.ativo && estoqueDe(p) > 0 && descontoDe(p) > 0)
      .sort((a, b) => descontoDe(b) - descontoDe(a));
    grid.replaceChildren(...ofertas.map(criarCard));
    vazio.hidden = ofertas.length > 0;
    if (ofertas.length) {
      document.getElementById('ofertasDesconto').textContent = `${descontoDe(ofertas[0])}%`;
      selo.hidden = false;
    }
  } catch (err) {
    grid.innerHTML = '<div class="ofertas-vazio"><p>Não foi possível carregar as ofertas agora.</p><button type="button" class="btn btn-ghost">Tentar novamente</button></div>';
    grid.querySelector('button').addEventListener('click', initPromocoes);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

/* ==========================================
   MOBILE MENU
   ========================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (!menuToggle || !mainNav) return;

  const fechar = () => {
    mainNav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('a');
    const mega = item.querySelector('.mega');
    if (!mega) return;
    link.addEventListener('click', (e) => {
      if (window.innerWidth > 860) return;
      if (!item.classList.contains('mega-open')) {
        e.preventDefault();
        document.querySelectorAll('.nav-item.mega-open').forEach(i => i !== item && i.classList.remove('mega-open'));
        item.classList.add('mega-open');
      } else {
        fechar();
      }
    });
  });

  document.querySelectorAll('.mega a').forEach(a => a.addEventListener('click', fechar));
  window.fecharMenuMobile = fechar;
}

/* ==========================================
   TOAST
   ========================================== */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ==========================================
   MODALS
   ========================================== */
function initModals() {
  const overlay = document.getElementById('modalOverlay');

  function openModal(id) {
    const m = document.getElementById(id);
    if (m && overlay) {
      overlay.classList.add('active');
      m.classList.add('active');
    }
  }

  function closeAllModals() {
    if (overlay) overlay.classList.remove('active');
    document.querySelectorAll('.modal.active, .cart-drawer.open').forEach(el => {
      el.classList.remove('active', 'open');
    });
  }

  document.querySelectorAll('.modal-close, #closeCart').forEach(btn => btn.addEventListener('click', closeAllModals));
  if (overlay) overlay.addEventListener('click', closeAllModals);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

  const olhoAberto = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  const olhoFechado = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-target'));
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      btn.innerHTML = mostrar ? olhoFechado : olhoAberto;
    });
  });

  const btnIrCadastro = document.getElementById('irParaCadastro');
  const btnIrLogin = document.getElementById('irParaLogin');
  if (btnIrCadastro) {
    btnIrCadastro.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => openModal('modalCadastro'), 300);
    });
  }
  if (btnIrLogin) {
    btnIrLogin.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => openModal('modalLogin'), 300);
    });
  }

  window.openModal = openModal;
  window.closeAllModals = closeAllModals;
}

/* ==========================================
   CART & LOCAL STORAGE
   ========================================== */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { cart = []; }

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

const chaveItem = item => item.cartKey || `${item.codProduto}:`;

// Soma as unidades do mesmo produto (todos os tons) que já estão na sacola
function qtdNaSacola(codProduto) {
  return cart.filter(i => String(i.codProduto) === String(codProduto)).reduce((s, i) => s + i.quantidade, 0);
}

// Adiciona "quantidade" unidades; só permite se houver estoque disponível
function addToCart(produto, quantidade = 1) {
  const estoque = produto.estoqueProduto ? Number(produto.estoqueProduto.quantidade_atual) : 0;
  if (estoque <= 0) {
    alert(`"${produto.nome}" está esgotado no momento e não pode ser adicionado à sacola.`);
    return false;
  }
  if (qtdNaSacola(produto.codProduto) + quantidade > estoque) {
    showToast(`Só temos ${estoque} unidade(s) disponível(is) deste produto.`);
    return false;
  }

  const item = {
    codProduto: produto.codProduto,
    nome: produto.tom ? `${produto.nome} — ${produto.tom}` : produto.nome,
    preco: produto.preco,
    imagem_url: produto.imagem_url || '',
    tom: produto.tom || '',
    estoqueProduto: { quantidade_atual: estoque }
  };
  item.cartKey = `${item.codProduto}:${item.tom}`;

  const existing = cart.find(i => chaveItem(i) === item.cartKey);
  if (existing) {
    existing.quantidade += quantidade;
    existing.estoqueProduto = item.estoqueProduto;
  } else {
    cart.push({ ...item, quantidade });
  }

  saveCart();
  updateCartUI();
  return true;
}

function removeFromCart(key) {
  cart = cart.filter(item => chaveItem(item) !== String(key));
  saveCart();
  updateCartUI();
}

function changeQty(key, delta) {
  const item = cart.find(i => chaveItem(i) === String(key));
  if (!item) return;
  const newQty = item.quantidade + delta;
  if (newQty <= 0) { removeFromCart(key); return; }
  const estoque = item.estoqueProduto ? Number(item.estoqueProduto.quantidade_atual) : Infinity;
  if (delta > 0 && qtdNaSacola(item.codProduto) + delta > estoque) {
    showToast('Estoque máximo atingido.');
    return;
  }
  item.quantidade = newQty;
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
  document.querySelectorAll('#cartCount, #cartDrawerCount').forEach(el => { el.textContent = totalItems; });

  const cartList = document.getElementById('cartList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');
  if (!cartList) return;

  if (cart.length === 0) {
    cartList.innerHTML = '';
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
    return;
  }
  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'block';

  let subtotal = 0;
  cartList.innerHTML = cart.map(item => {
    const preco = parseFloat(item.preco);
    const key = esc(chaveItem(item));
    subtotal += preco * item.quantidade;
    return `
      <li class="cart-item">
        <a class="cart-item-thumb" href="${urlProduto(item)}">
          ${item.imagem_url ? `<img src="${esc(item.imagem_url)}" alt="${esc(item.nome)}">` : '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="20" y="14" width="24" height="36" rx="4"/></svg>'}
        </a>
        <div class="cart-item-info">
          <h4 class="cart-item-name">${esc(item.nome)}</h4>
          <div class="cart-item-price">${formatarPreco(preco)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" data-qtd="-1" data-key="${key}" aria-label="Diminuir">-</button>
            <span class="cart-qty">${item.quantidade}</span>
            <button class="qty-btn" data-qtd="1" data-key="${key}" aria-label="Aumentar">+</button>
            <button class="cart-item-remove" data-remover="${key}">Remover</button>
          </div>
        </div>
      </li>
    `;
  }).join('');

  // Regra de frete: igual em pedido.controller.js e checkout.html
  const frete = subtotal >= 150 ? 0 : 15.90;
  const total = subtotal + frete;

  document.getElementById('cartSubtotal').textContent = formatarPreco(subtotal);
  document.getElementById('cartFrete').textContent = frete === 0 ? 'Grátis' : formatarPreco(frete);
  document.getElementById('cartTotal').textContent = formatarPreco(total);

  const freteHint = document.getElementById('freteHint');
  if (frete === 0) {
    freteHint.textContent = 'Você ganhou frete grátis! 🎉';
    freteHint.style.color = '#38a169';
  } else {
    freteHint.textContent = `Faltam ${formatarPreco(150 - subtotal)} para frete grátis.`;
    freteHint.style.color = 'var(--taupe)';
  }
}

function initCart() {
  updateCartUI();

  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('modalOverlay');
  const cartList = document.getElementById('cartList');

  if (cartBtn && cartDrawer) {
    cartBtn.addEventListener('click', () => {
      window.closeAllModals();
      overlay.classList.add('active');
      cartDrawer.classList.add('open');
    });
  }

  if (cartList) {
    cartList.addEventListener('click', (e) => {
      const qtd = e.target.closest('[data-qtd]');
      const remover = e.target.closest('[data-remover]');
      if (qtd) changeQty(qtd.dataset.key, Number(qtd.dataset.qtd));
      if (remover) removeFromCart(remover.dataset.remover);
    });
  }

  const btnContShop = document.getElementById('btnContShop');
  if (btnContShop && document.getElementById('catalogoSecoes')) {
    btnContShop.addEventListener('click', () => window.closeAllModals());
  }
}

/* ==========================================
   AUTH & CPF VALIDATION
   ========================================== */
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch (e) { return null; }
}

// Mesma regra de usuario.controller.js (validarCPF). Mudou uma, mude a outra.
function validaCpfClient(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

function initAuth() {
  // A loja é só para clientes; o painel tem login próprio em /admin.
  // Sessão antiga de administrador guardada nas chaves da loja é descartada.
  const salvo = getUser();
  if (salvo && salvo.tipo_usuario !== 'CLIENTE') {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
  const user = getUser();
  const contaBtnLabel = document.getElementById('contaBtnLabel');
  const contaBtn = document.getElementById('contaBtn');
  const perfilNome = document.getElementById('perfilNome');
  const navLoginTop = document.getElementById('navLoginTop');

  if (user) {
    if (contaBtnLabel) contaBtnLabel.textContent = user.nome.split(' ')[0];
    if (perfilNome) perfilNome.textContent = user.nome;
    if (navLoginTop) navLoginTop.style.display = 'none';
  } else if (navLoginTop) {
    navLoginTop.style.display = 'block';
  }

  if (contaBtn) {
    contaBtn.addEventListener('click', () => {
      window.openModal(getUser() ? 'modalPerfil' : 'modalLogin');
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = 'index.html';
    });
  }

  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const senha = document.getElementById('loginSenha').value;
      const erroEl = document.getElementById('erroLogin');
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          window.location.reload();
        } else {
          erroEl.textContent = data.erro || 'Erro ao fazer login.';
        }
      } catch (err) {
        erroEl.textContent = 'Erro de conexão com o servidor.';
      }
    });
  }

  const cadCPF = document.getElementById('cadCPF');
  const cpfHint = document.getElementById('cpfHint');
  if (cadCPF) {
    cadCPF.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      e.target.value = v;

      if (v.replace(/\D/g, '').length === 11) {
        const valido = validaCpfClient(v);
        cpfHint.textContent = valido ? 'CPF válido ✓' : 'CPF inválido ✗';
        cpfHint.className = `field-hint ${valido ? 'ok' : 'err'}`;
        cadCPF.classList.toggle('valid', valido);
        cadCPF.classList.toggle('invalid', !valido);
      } else {
        cpfHint.textContent = '';
        cadCPF.classList.remove('valid', 'invalid');
      }
    });
  }

  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('cadNome').value;
      const email = document.getElementById('cadEmail').value;
      const cpf = document.getElementById('cadCPF').value;
      const telefone = document.getElementById('cadTelefone').value;
      const senha = document.getElementById('cadSenha').value;
      const identidade = document.getElementById('cadIdentidade').value;
      const erroEl = document.getElementById('erroCadastro');

      if (!validaCpfClient(cpf)) {
        erroEl.textContent = 'Corrija o CPF antes de continuar.';
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, cpf, telefone, senha, identidade })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Cadastro realizado! Faça login.');
          window.closeAllModals();
          setTimeout(() => window.openModal('modalLogin'), 500);
        } else {
          erroEl.textContent = data.erro || 'Erro ao cadastrar.';
        }
      } catch (err) {
        erroEl.textContent = 'Erro de conexão com o servidor.';
      }
    });
  }
}

/* ==========================================
   BUSCA DO HEADER E NEWSLETTER
   ========================================== */
function initBusca() {
  const form = document.getElementById('formBusca');
  const input = document.getElementById('buscaInput');
  if (!form || !input) return;

  const termoUrl = new URLSearchParams(location.search).get('busca');
  if (termoUrl) input.value = termoUrl;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const termo = input.value.trim();
    // Fora da página inicial, a busca leva para o catálogo
    if (!document.getElementById('catalogoSecoes')) {
      location.href = termo ? `index.html?busca=${encodeURIComponent(termo)}#catalogo` : 'index.html#catalogo';
      return;
    }
    window.buscarCatalogo(termo);
  });
}

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    showToast('Pronto! Você vai receber nossas novidades por e-mail.');
  });
}

/* ==========================================
   CONTEÚDO EDITÁVEL (GET /conteudos)
   Elementos com data-conteudo="chave" recebem o texto salvo pelo admin.
   Se a API não responder, fica o texto que já está no HTML.
   ========================================== */
let conteudoPromise = null;
function carregarConteudo() {
  if (!conteudoPromise) conteudoPromise = apiGet('/conteudos').catch(() => null);
  return conteudoPromise;
}

async function initConteudo() {
  if (!document.querySelector('[data-conteudo], [data-conteudo-src], [data-conteudo-href]')) return;
  const conteudo = await carregarConteudo();
  if (!conteudo) return;

  document.querySelectorAll('[data-conteudo]').forEach(el => {
    const valor = conteudo[el.dataset.conteudo];
    if (!valor) return;
    if (el.dataset.formato === 'texto') renderizarTexto(el, valor);
    else preencherComDestaque(el, valor);
  });
  document.querySelectorAll('[data-conteudo-src]').forEach(el => {
    const valor = conteudo[el.dataset.conteudoSrc];
    if (valor) el.src = valor;
  });
  document.querySelectorAll('[data-conteudo-alt]').forEach(el => {
    const valor = conteudo[el.dataset.conteudoAlt];
    if (valor) el.alt = valor;
  });
  document.querySelectorAll('[data-conteudo-href]').forEach(el => {
    let valor = String(conteudo[el.dataset.conteudoHref] || '').trim();
    if (el.dataset.conteudoHref === 'rede_whatsapp') {
      let numero = valor.replace(/\D/g, '');
      if (numero.length === 10 || numero.length === 11) numero = '55' + numero;
      valor = /^55[1-9]{2}\d{8,9}$/.test(numero) ? `https://wa.me/${numero}` : '';
    }
    try {
      const url = new URL(valor);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Link inválido');
      el.href = url.href;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.hidden = false;
    } catch (err) {
      el.hidden = true;
      el.removeAttribute('href');
    }
  });
}

/* ==========================================
   CARDS E CARROSSÉIS DE PRODUTOS
   Cada carrossel é uma grade: quando os cards chegam ao fim da largura
   da página, continuam na linha de baixo (nada de rolagem lateral).
   ========================================== */
/* ==========================================
   FAVORITOS
   Lista de codProduto em localStorage['favoritos']. O coração do cabeçalho
   abre uma gaveta com os produtos salvos (dados atuais vindos da API).
   ========================================== */
let favoritos = [];
try { favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]').map(Number).filter(Boolean); } catch (e) { favoritos = []; }

const ehFavorito = (id) => favoritos.includes(Number(id));

function alternarFavorito(produto) {
  const id = Number(produto.codProduto);
  const adicionou = !ehFavorito(id);
  favoritos = adicionou ? [...favoritos, id] : favoritos.filter(f => f !== id);
  try { localStorage.setItem('favoritos', JSON.stringify(favoritos)); } catch (e) { /* sem armazenamento: vale só nesta página */ }
  sincronizarFavoritos();
  showToast(adicionou ? `${produto.nome} salvo nos favoritos ♥` : `${produto.nome} removido dos favoritos`);
  const btn = document.getElementById('wishlistBtn');
  if (btn && adicionou) {
    btn.classList.remove('pulsar');
    void btn.offsetWidth;
    btn.classList.add('pulsar');
  }
  return adicionou;
}

// Atualiza contador do cabeçalho, corações dos cards, botão da página do produto e a gaveta
function sincronizarFavoritos() {
  const btn = document.getElementById('wishlistBtn');
  const contador = document.getElementById('favCount');
  if (btn) btn.classList.toggle('tem-favoritos', favoritos.length > 0);
  if (contador) contador.textContent = favoritos.length;
  document.querySelectorAll('[data-fav-id]').forEach(el => {
    const ativo = ehFavorito(el.dataset.favId);
    el.classList.toggle('active', ativo);
    el.setAttribute('aria-pressed', String(ativo));
    el.setAttribute('aria-label', ativo ? 'Remover dos favoritos' : 'Salvar nos favoritos');
  });
  const gaveta = document.getElementById('favDrawer');
  if (gaveta && gaveta.classList.contains('open')) desenharFavoritos();
}

let produtosFavoritos = null;

async function desenharFavoritos() {
  const lista = document.getElementById('favList');
  const vazio = document.getElementById('favEmpty');
  const titulo = document.getElementById('favDrawerCount');
  titulo.textContent = favoritos.length;
  if (!favoritos.length) {
    lista.innerHTML = '';
    vazio.style.display = 'flex';
    return;
  }
  vazio.style.display = 'none';

  if (!produtosFavoritos) {
    lista.innerHTML = '<li class="fav-rodape-nota">Carregando seus favoritos...</li>';
    try {
      produtosFavoritos = await apiGet('/produtos');
    } catch (err) {
      lista.innerHTML = '<li class="fav-rodape-nota">Não foi possível carregar os favoritos agora. Tente novamente em instantes.</li>';
      return;
    }
  }

  // Produto desativado ou removido some da lista (e do armazenamento)
  const salvos = favoritos.map(id => produtosFavoritos.find(p => p.codProduto === id)).filter(Boolean);
  if (salvos.length !== favoritos.length) {
    favoritos = salvos.map(p => p.codProduto);
    try { localStorage.setItem('favoritos', JSON.stringify(favoritos)); } catch (e) { /* ignora */ }
    sincronizarFavoritos();
    titulo.textContent = favoritos.length;
    if (!favoritos.length) { vazio.style.display = 'flex'; lista.innerHTML = ''; return; }
  }

  lista.innerHTML = salvos.map(p => {
    const estoque = estoqueDe(p);
    const comTom = tonsEscolhiveis(p).length > 0;
    const desconto = descontoDe(p);
    let acao;
    if (estoque <= 0) acao = '<button type="button" class="fav-comprar" aria-disabled="true">Esgotado</button>';
    else if (comTom) acao = `<a class="fav-comprar" href="${urlProduto(p)}">Escolher tom</a>`;
    else acao = `<button type="button" class="fav-comprar" data-fav-comprar="${p.codProduto}">Adicionar à sacola</button>`;
    return `
      <li class="cart-item">
        <a class="cart-item-thumb" href="${urlProduto(p)}">
          ${p.imagem_url ? `<img src="${esc(p.imagem_url)}" alt="${esc(p.nome)}">` : iconeProduto(p)}
        </a>
        <div class="cart-item-info">
          <h4 class="cart-item-name"><a href="${urlProduto(p)}">${esc(p.nome)}</a></h4>
          <div class="cart-item-price">${formatarPreco(p.preco)}${desconto ? ` <s style="color:var(--taupe-light);font-weight:400;font-size:.8em">${formatarPreco(p.preco_antigo)}</s>` : ''}</div>
          <div class="fav-acoes">${acao}<a class="fav-ver" href="${urlProduto(p)}">Ver produto</a></div>
        </div>
        <button type="button" class="fav-remover" data-fav-remover="${p.codProduto}" aria-label="Remover ${esc(p.nome)} dos favoritos" title="Remover dos favoritos">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.2 5.6 3.6c2.1-.4 4 .6 6.4 3 2.4-2.4 4.3-3.4 6.4-3 3.6.6 5.2 4.2 3.6 7.6-2.5 4.7-10 9.3-10 9.3z"/></svg>
        </button>
      </li>`;
  }).join('');
}

function initFavoritos() {
  const btn = document.getElementById('wishlistBtn');
  const overlay = document.getElementById('modalOverlay');
  if (!btn || !overlay) return;

  // Contador no coração do cabeçalho
  if (!document.getElementById('favCount')) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.id = 'favCount';
    btn.appendChild(badge);
  }

  // Gaveta de favoritos (mesmo visual da sacola), criada aqui para valer nas três páginas
  const gaveta = document.createElement('div');
  gaveta.className = 'cart-drawer';
  gaveta.id = 'favDrawer';
  gaveta.setAttribute('role', 'dialog');
  gaveta.setAttribute('aria-modal', 'true');
  gaveta.setAttribute('aria-label', 'Seus favoritos');
  gaveta.innerHTML = `
    <div class="cart-drawer-header">
      <h3>Favoritos <span class="badge" id="favDrawerCount">0</span></h3>
      <button class="cart-close" type="button" id="closeFav" aria-label="Fechar favoritos">×</button>
    </div>
    <div class="cart-drawer-body">
      <div class="cart-empty" id="favEmpty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.2 5.6 3.6c2.1-.4 4 .6 6.4 3 2.4-2.4 4.3-3.4 6.4-3 3.6.6 5.2 4.2 3.6 7.6-2.5 4.7-10 9.3-10 9.3z"/></svg>
        <p>Você ainda não salvou nenhum produto.</p>
        <p class="fav-rodape-nota">Toque no coração dos produtos para guardá-los aqui.</p>
        <a href="index.html#catalogo" class="btn btn-primary" id="favVerProdutos">Ver produtos</a>
      </div>
      <ul class="cart-list fav-lista" id="favList"></ul>
    </div>`;
  document.body.appendChild(gaveta);

  btn.setAttribute('aria-haspopup', 'dialog');
  btn.addEventListener('click', () => {
    window.closeAllModals();
    overlay.classList.add('active');
    gaveta.classList.add('open');
    desenharFavoritos();
  });
  document.getElementById('closeFav').addEventListener('click', () => window.closeAllModals());
  document.getElementById('favVerProdutos').addEventListener('click', () => window.closeAllModals());

  gaveta.addEventListener('click', (e) => {
    const remover = e.target.closest('[data-fav-remover]');
    if (remover) {
      const p = (produtosFavoritos || []).find(x => x.codProduto === Number(remover.dataset.favRemover));
      if (p) alternarFavorito(p);
    }
    const comprar = e.target.closest('[data-fav-comprar]');
    if (comprar) {
      const p = (produtosFavoritos || []).find(x => x.codProduto === Number(comprar.dataset.favComprar));
      if (p && addToCart(p)) showToast(`${p.nome} adicionado à sacola`);
    }
  });

  // Outra aba alterou os favoritos
  window.addEventListener('storage', (e) => {
    if (e.key !== 'favoritos') return;
    try { favoritos = JSON.parse(e.newValue || '[]').map(Number).filter(Boolean); } catch (err) { favoritos = []; }
    sincronizarFavoritos();
  });

  sincronizarFavoritos();
}

function criarCard(produto) {
  const estoque = estoqueDe(produto);
  const desconto = descontoDe(produto);
  const escolhiveis = tonsEscolhiveis(produto);
  const tons = (produto.tons || []).length > 1 ? escolhiveis : produto.tons || [];
  const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : '';
  const rotulo = produto.rotulo ? produto.rotulo.charAt(0) + produto.rotulo.slice(1).toLowerCase() : '';
  const favorito = ehFavorito(produto.codProduto);

  let textoBotao = 'Adicionar à sacola';
  if (estoque <= 0) textoBotao = 'Esgotado';
  else if (escolhiveis.length) textoBotao = 'Escolher tom';

  const card = document.createElement('article');
  card.className = 'card' + (estoque <= 0 ? ' card-esgotado' : '');
  card.innerHTML = `
    <a class="card-media ${produto.imagem_url ? 'card-media--img' : ''}" href="${urlProduto(produto)}" aria-label="${esc(produto.nome)}">
      ${produto.imagem_url ? `<img src="${esc(produto.imagem_url)}" alt="${esc(produto.nome)}" loading="lazy">` : iconeProduto(produto)}
      ${desconto ? `<span class="badge-off">-${desconto}%</span>` : ''}
      ${estoque <= 0 ? '<span class="badge-esgotado">Esgotado</span>' : ''}
    </a>
    <button type="button" class="card-wishlist ${favorito ? 'active' : ''}" data-fav-id="${produto.codProduto}" aria-label="${favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}" aria-pressed="${favorito}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.2 5.6 3.6c2.1-.4 4 .6 6.4 3 2.4-2.4 4.3-3.4 6.4-3 3.6.6 5.2 4.2 3.6 7.6-2.5 4.7-10 9.3-10 9.3z"/></svg>
    </button>
    <div class="card-body">
      <span class="card-cat">${esc([categoria, rotulo].filter(Boolean).join(' · '))}</span>
      <h3 class="card-name"><a href="${urlProduto(produto)}">${esc(produto.nome)}</a></h3>
      ${tons.length ? `<div class="card-shades">${tons.map((t, i) => `<button type="button" class="shade-dot" style="background:${esc(t.cor)}" data-tom="${i}" title="${esc(t.nome || 'Cor ilustrativa')}" aria-label="${esc(t.nome || 'Cor ilustrativa')}"></button>`).join('')}</div>` : ''}
      <div class="card-price">
        <span class="price-now">${formatarPreco(produto.preco)}</span>
        ${desconto ? `<span class="price-old">${formatarPreco(produto.preco_antigo)}</span>` : ''}
      </div>
      ${normalizar(produto.rotulo) === 'base' || /^base\b/.test(normalizar(produto.nome)) ? `<a class="pv-card-link" href="${urlProduto(produto)}#provadorBase">Experimentar no meu rosto ↗</a>` : ''}
      <button type="button" class="add-btn" ${estoque <= 0 ? 'aria-disabled="true"' : ''}>${textoBotao}</button>
    </div>
  `;

  // Bolinhas de tom trocam a foto do card
  card.querySelectorAll('.shade-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const tom = tons[Number(dot.dataset.tom)];
      card.querySelectorAll('.shade-dot').forEach(d => d.setAttribute('aria-pressed', String(d === dot)));
      const img = card.querySelector('.card-media img');
      if (img && tom.imagem) img.src = tom.imagem;
    });
  });

  const wish = card.querySelector('.card-wishlist');
  wish.addEventListener('click', () => alternarFavorito(produto));

  const btn = card.querySelector('.add-btn');
  btn.addEventListener('click', () => {
    if (estoque > 0 && escolhiveis.length) {
      location.href = urlProduto(produto);
      return;
    }
    if (addToCart(produto)) {
      btn.textContent = 'Adicionado ✓';
      btn.classList.add('added');
      showToast(`${produto.nome} adicionado à sacola`);
      setTimeout(() => {
        btn.textContent = textoBotao;
        btn.classList.remove('added');
      }, 1400);
    }
  });

  return card;
}

// Módulo de categoria: painel de apresentação à esquerda (fixo na rolagem) e grade de produtos à direita
function criarCarrossel({ titulo, descricao, produtos, id, categoria, numero }) {
  const secao = document.createElement('section');
  secao.className = 'vitrine-secao';
  if (id) secao.id = id;
  if (categoria) secao.dataset.categoria = categoria;
  const fotos = produtos.filter(p => p.imagem_url).slice(0, 3);
  secao.innerHTML = `
    <div class="vitrine-inner">
      <header class="vitrine-intro">
        <div class="vitrine-intro-texto">
          ${numero ? `<span class="vitrine-num">${String(numero).padStart(2, '0')}</span>` : ''}
          <h2>${esc(titulo)}</h2>
          ${descricao ? `<p>${esc(descricao)}</p>` : ''}
          <span class="vitrine-contagem">${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}</span>
        </div>
        ${fotos.length ? `<div class="vitrine-leque" aria-hidden="true">${fotos.map(p => `<img src="${esc(p.imagem_url)}" alt="" loading="lazy">`).join('')}</div>` : ''}
      </header>
      <div class="vitrine-grid"></div>
    </div>
  `;
  const grid = secao.querySelector('.vitrine-grid');
  produtos.forEach(p => grid.appendChild(criarCard(p)));
  return secao;
}

function slug(texto) {
  return normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ==========================================
   CATÁLOGO DA PÁGINA INICIAL
   Filtro começa em "Todos" e mostra todos os carrosséis, um abaixo do outro.
   ========================================== */
async function initCatalogo() {
  const secoesEl = document.getElementById('catalogoSecoes');
  if (!secoesEl) return;

  const filtroEl = document.getElementById('filtroCategorias');
  const contagemEl = document.getElementById('catalogoContagem');
  const buscaAtiva = document.getElementById('buscaAtiva');
  const buscaTermo = document.getElementById('buscaTermo');

  // Enquanto a API responde, o filtro mostra cartões "fantasma" no lugar das categorias
  filtroEl.innerHTML = Array.from({ length: 6 }, () => '<span class="filtro-chip filtro-chip--carregando" aria-hidden="true"></span>').join('');
  secoesEl.innerHTML = '<p class="vitrine-aviso">Carregando produtos...</p>';

  let categorias, produtos;
  try {
    [categorias, produtos] = await Promise.all([apiGet('/categorias'), apiGet('/produtos')]);
  } catch (err) {
    filtroEl.innerHTML = '';
    secoesEl.innerHTML = `
      <div class="vitrine-aviso erro">
        <p>Não foi possível carregar os produtos agora. Verifique se a API está no ar e tente novamente.</p>
        <button type="button" class="btn btn-primary" id="tentarCatalogo">Tentar novamente</button>
      </div>`;
    document.getElementById('tentarCatalogo').addEventListener('click', initCatalogo);
    return;
  }

  // Um carrossel por categoria (na ordem de cadastro), só as que têm produto ativo
  const grupos = [...categorias]
    .sort((a, b) => a.codCategoria - b.codCategoria)
    .map(c => ({ categoria: c, produtos: produtos.filter(p => p.idCategoria === c.codCategoria) }))
    .filter(g => g.produtos.length);

  const secoes = grupos.map((g, i) => criarCarrossel({
    titulo: g.categoria.nome,
    descricao: g.categoria.descricao,
    produtos: g.produtos,
    id: `categoria-${slug(g.categoria.nome)}`,
    categoria: g.categoria.nome,
    numero: i + 1
  }));

  secoesEl.innerHTML = '';
  secoes.forEach(s => secoesEl.appendChild(s));
  if (!secoes.length) {
    secoesEl.innerHTML = '<p class="vitrine-aviso">Nenhum produto disponível no momento.</p>';
  }

  // Filtro: um cartão por categoria com a foto de um produto dela de fundo
  // ("Todos" mostra um mosaico com uma foto de cada categoria)
  const fotoDe = (lista) => lista.find(p => p.imagem_url);
  const botaoFiltro = (categoria, rotulo, qtd, fundo, comFoto) => `
    <button type="button" class="filtro-chip ${comFoto ? '' : 'filtro-chip--sem-foto'}" data-categoria="${esc(categoria)}">
      <span class="filtro-fundo" aria-hidden="true">${fundo}</span>
      <span class="filtro-texto">
        <span class="filtro-nome">${esc(rotulo)}</span>
        <span class="filtro-qtd">${qtd} ${qtd === 1 ? 'produto' : 'produtos'}</span>
      </span>
      <span class="filtro-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>
    </button>`;
  const mosaico = grupos.map(g => fotoDe(g.produtos)).filter(Boolean).slice(0, 4);
  filtroEl.innerHTML = [
    botaoFiltro('', 'Todos', produtos.length,
      `<span class="filtro-mosaico">${mosaico.map(p => `<img src="${esc(p.imagem_url)}" alt="" loading="lazy">`).join('')}</span>`, mosaico.length > 0),
    ...grupos.map(g => {
      const foto = fotoDe(g.produtos);
      return botaoFiltro(g.categoria.nome, g.categoria.nome, g.produtos.length,
        foto ? `<img src="${esc(foto.imagem_url)}" alt="" loading="lazy">` : iconeProduto(g.produtos[0]), Boolean(foto));
    })
  ].join('');

  let secaoBusca = null;

  function marcarAlternadas() {
    secoesEl.querySelectorAll('.vitrine-secao:not([hidden])').forEach((s, i) => s.classList.toggle('alt', i % 2 === 1));
  }

  function atualizarUrl(param, valor) {
    const url = new URL(location.href);
    url.searchParams.delete('categoria');
    url.searchParams.delete('busca');
    if (valor) url.searchParams.set(param, valor);
    history.replaceState(null, '', url.pathname + url.search + '#catalogo');
  }

  function aplicarFiltro(nomeCategoria, { rolar = false } = {}) {
    const alvo = grupos.find(g => normalizar(g.categoria.nome) === normalizar(nomeCategoria));
    const nome = alvo ? alvo.categoria.nome : '';

    if (secaoBusca) { secaoBusca.remove(); secaoBusca = null; }
    buscaAtiva.hidden = true;

    filtroEl.querySelectorAll('.filtro-chip').forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip.dataset.categoria === nome));
    });
    secoes.forEach(s => { s.hidden = Boolean(nome) && s.dataset.categoria !== nome; });
    marcarAlternadas();

    const total = alvo ? alvo.produtos.length : produtos.length;
    contagemEl.textContent = `${total} ${total === 1 ? 'produto' : 'produtos'}${nome ? ` em ${nome}` : ''}`;
    atualizarUrl('categoria', nome);
    if (rolar) document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function buscar(termo) {
    if (!termo) { aplicarFiltro(''); return; }
    let resultado;
    try {
      resultado = await apiGet(`/produtos/buscar?nome=${encodeURIComponent(termo)}`);
    } catch (err) {
      showToast('Não foi possível buscar agora.');
      return;
    }
    if (secaoBusca) secaoBusca.remove();
    secoes.forEach(s => { s.hidden = true; });
    filtroEl.querySelectorAll('.filtro-chip').forEach(chip => chip.setAttribute('aria-pressed', 'false'));

    secaoBusca = resultado.length
      ? criarCarrossel({ titulo: 'Resultados da busca', produtos: resultado, id: 'resultadoBusca' })
      : Object.assign(document.createElement('p'), { className: 'vitrine-aviso', textContent: 'Nenhum produto encontrado. Tente outro termo ou navegue pelas categorias.' });
    secoesEl.prepend(secaoBusca);
    marcarAlternadas();

    buscaTermo.textContent = termo;
    buscaAtiva.hidden = false;
    contagemEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    atualizarUrl('busca', termo);
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  filtroEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.filtro-chip');
    if (chip) aplicarFiltro(chip.dataset.categoria);
  });

  document.getElementById('limparBusca').addEventListener('click', () => {
    document.getElementById('buscaInput').value = '';
    aplicarFiltro('');
  });

  // Links do menu, rodapé e banner com data-filtro filtram sem recarregar a página
  document.querySelectorAll('[data-filtro]').forEach(link => {
    link.addEventListener('click', (e) => {
      // No celular o 1º toque no menu só abre o submenu (initMobileMenu já cancelou o clique)
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (window.fecharMenuMobile) window.fecharMenuMobile();
      aplicarFiltro(link.dataset.filtro, { rolar: true });
    });
  });

  window.buscarCatalogo = buscar;

  const params = new URLSearchParams(location.search);
  if (params.get('busca')) buscar(params.get('busca'));
  else aplicarFiltro(params.get('categoria') || '', { rolar: Boolean(params.get('categoria')) });
}

/* ==========================================
   PÁGINA DO PRODUTO (produto.html?id=)
   Foto + compra, história do produto e, abaixo, o carrossel da categoria.
   ========================================== */
async function initProdutoPagina() {
  const raiz = document.getElementById('produtoPagina');
  if (!raiz) return;

  const id = new URLSearchParams(location.search).get('id');
  const mostrarErro = (msg) => {
    raiz.innerHTML = `<div class="vitrine-aviso erro"><p>${esc(msg)}</p><a href="index.html#catalogo" class="btn btn-primary">Ver todos os produtos</a></div>`;
  };
  if (!id) { mostrarErro('Produto não informado.'); return; }

  let produto;
  try {
    produto = await apiGet(`/produtos/${encodeURIComponent(id)}`);
  } catch (err) {
    mostrarErro('Produto não encontrado.');
    return;
  }

  const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : '';
  const estoque = produto.ativo ? estoqueDe(produto) : 0;
  const desconto = descontoDe(produto);
  const escolhiveis = tonsEscolhiveis(produto);
  const ilustrativos = escolhiveis.length ? [] : (produto.tons || []).filter(t => !t.nome);

  // Galeria: fotos do produto + fotos dos tons que não estiverem na lista
  const imagens = [...(produto.imagens || [])];
  if (!imagens.length && produto.imagem_url) imagens.push(produto.imagem_url);
  escolhiveis.forEach(t => { if (t.imagem && !imagens.includes(t.imagem)) imagens.push(t.imagem); });
  const fotoInicial = escolhiveis[0]?.imagem || imagens[0];

  document.title = `${produto.nome} — BE YOU Maquiagem`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && produto.descricao) meta.setAttribute('content', produto.descricao);

  const linkCategoria = `index.html?categoria=${encodeURIComponent(categoria)}#catalogo`;
  const parcelas = parseFloat(produto.preco) / 3;

  raiz.innerHTML = `
    <nav class="breadcrumb" aria-label="Você está em">
      <a href="index.html">Início</a><span>/</span>
      <a href="${linkCategoria}">${esc(categoria)}</a><span>/</span>
      <span aria-current="page">${esc(produto.nome)}</span>
    </nav>

    <div class="produto-topo">
      <div class="produto-galeria">
        <div class="produto-foto">
          ${imagens.length ? `<img id="produtoFoto" src="${esc(fotoInicial)}" alt="${esc(produto.nome + (escolhiveis[0] ? ' — ' + escolhiveis[0].nome : ''))}">` : `<div class="produto-icone">${iconeProduto(produto)}</div>`}
          ${desconto ? `<span class="badge-off">-${desconto}%</span>` : ''}
        </div>
        ${imagens.length > 1 ? `<div class="produto-miniaturas">${imagens.map((src, i) => `
          <button type="button" class="pm-thumb ${src === fotoInicial ? 'active' : ''}" data-img="${esc(src)}" aria-label="Ver foto ${i + 1}">
            <img src="${esc(src)}" alt="" loading="lazy">
          </button>`).join('')}</div>` : ''}
      </div>

      <div class="produto-info">
        <span class="pm-breadcrumb">${esc([categoria, produto.rotulo].filter(Boolean).join(' · '))}</span>
        <h1 class="pm-title">${esc(produto.nome)}</h1>

        <div class="pm-price-block">
          ${desconto ? `<span class="pm-price-old">${formatarPreco(produto.preco_antigo)}</span>` : ''}
          <span class="pm-price-now">${formatarPreco(produto.preco)}</span>
          <span class="pm-installments">ou 3× de ${formatarPreco(parcelas)} sem juros</span>
        </div>

        ${escolhiveis.length ? `
        <div class="pm-shades-block">
          <span class="pm-label">Tom: <strong id="tomEscolhido">${esc(escolhiveis[0].nome)}</strong></span>
          <div class="pm-shade-swatches">${escolhiveis.map((t, i) => `
            <button type="button" class="pm-swatch ${i === 0 ? 'active' : ''}" style="background:${esc(t.cor)}" data-tom="${i}" title="${esc(t.nome)}" aria-label="${esc(t.nome)}" aria-pressed="${i === 0}"></button>`).join('')}
          </div>
        </div>` : ''}
        ${ilustrativos.length ? `
        <div class="pm-shades-block">
          <span class="pm-label">Cores</span>
          <div class="pm-shade-swatches">${ilustrativos.map(t => `<span class="pm-swatch pm-swatch--fixo" style="background:${esc(t.cor)}"></span>`).join('')}</div>
        </div>` : ''}

        <p class="produto-estoque ${estoque <= 0 ? 'esgotado' : ''}">
          ${!produto.ativo ? 'Produto indisponível no momento.' : estoque <= 0 ? 'Esgotado no momento.' : estoque <= 5 ? `Últimas ${estoque} unidades!` : 'Em estoque'}
        </p>

        <div class="pm-qty-block">
          <span class="pm-label">Quantidade</span>
          <div class="pm-qty-ctrl">
            <button type="button" class="pm-qty-btn" id="qtdMenos" aria-label="Diminuir">−</button>
            <span class="pm-qty-val" id="qtdValor">1</span>
            <button type="button" class="pm-qty-btn" id="qtdMais" aria-label="Aumentar">+</button>
          </div>
        </div>

        <div class="pm-actions">
          <button type="button" class="pm-add-btn" id="btnAdicionar" ${estoque <= 0 ? 'aria-disabled="true"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
            ${estoque <= 0 ? 'Esgotado' : 'Adicionar à sacola'}
          </button>
          <button type="button" class="pm-fav-btn" id="btnFavoritar" data-fav-id="${produto.codProduto}" aria-pressed="${ehFavorito(produto.codProduto)}" aria-label="${ehFavorito(produto.codProduto) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}" title="Favoritos">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.2 5.6 3.6c2.1-.4 4 .6 6.4 3 2.4-2.4 4.3-3.4 6.4-3 3.6.6 5.2 4.2 3.6 7.6-2.5 4.7-10 9.3-10 9.3z"/></svg>
          </button>
        </div>

        <div class="pm-shipping">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="15" height="12" rx="2"/><path d="M18 10h2.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H18"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="14" cy="19" r="1.6"/></svg>
          <span><strong>Frete grátis</strong> nas compras acima de R$ 150,00. <a href="pagina.html?p=entrega">Prazos de entrega</a></span>
        </div>

        ${produto.descricao ? `<div class="pm-desc-block"><h2 class="pm-desc-title">Descrição</h2><p class="pm-desc">${esc(produto.descricao)}</p></div>` : ''}
      </div>
    </div>

    <section class="produto-historia" aria-labelledby="historiaTitulo">
      <div class="produto-historia-texto">
        <span class="secao-eyebrow">A história</span>
        <h2 id="historiaTitulo">${esc(produto.nome)}</h2>
        <div id="historiaConteudo"></div>
      </div>
      <aside class="produto-ficha" aria-label="Ficha do produto">
        <h3>Ficha do produto</h3>
        <dl>
          <div><dt>Categoria</dt><dd>${esc(categoria || '—')}</dd></div>
          ${produto.rotulo ? `<div><dt>Tipo</dt><dd>${esc(produto.rotulo.charAt(0) + produto.rotulo.slice(1).toLowerCase())}</dd></div>` : ''}
          <div><dt>${escolhiveis.length ? 'Tons' : 'Cores'}</dt><dd>${escolhiveis.length ? esc(escolhiveis.map(t => t.nome).join(', ')) : ilustrativos.length ? `${ilustrativos.length} ${ilustrativos.length === 1 ? 'cor' : 'cores'}` : 'Tom único'}</dd></div>
          <div><dt>Código</dt><dd>BY-${String(produto.codProduto).padStart(4, '0')}</dd></div>
          <div><dt>Registro</dt><dd>Produto cosmético notificado na ANVISA</dd></div>
        </dl>
        <p class="produto-ficha-nota">Troca grátis em até 30 dias · Entrega em todo o Brasil</p>
      </aside>
    </section>
  `;

  const ehBase = normalizar(produto.rotulo) === 'base' || /^base\b/.test(normalizar(produto.nome));
  const provador = ehBase && window.criarProvadorBase ? window.criarProvadorBase(raiz, produto, escolhiveis, indice => {
    raiz.querySelector('.pm-swatch[data-tom="' + indice + '"]')?.click();
  }) : null;
  if (provador) raiz.querySelector('.pm-shades-block')?.insertAdjacentHTML('beforeend', '<a class="pv-product-link" href="#provadorBase">Experimentar no meu rosto ↗</a>');
  renderizarTexto(document.getElementById('historiaConteudo'),
    produto.historia || produto.descricao || 'Um produto BE YOU pensado para realçar a sua beleza natural.');

  // Galeria
  const foto = document.getElementById('produtoFoto');
  const trocarFoto = (src) => {
    if (!foto || !src) return;
    foto.src = src;
    raiz.querySelectorAll('.produto-miniaturas .pm-thumb').forEach(b => b.classList.toggle('active', b.dataset.img === src));
  };
  raiz.querySelectorAll('.produto-miniaturas .pm-thumb').forEach(b => b.addEventListener('click', () => trocarFoto(b.dataset.img)));

  // Tons
  let tom = escolhiveis[0] || null;
  raiz.querySelectorAll('.pm-swatch[data-tom]').forEach(btn => {
    btn.addEventListener('click', () => {
      tom = escolhiveis[Number(btn.dataset.tom)];
      raiz.querySelectorAll('.pm-swatch[data-tom]').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.getElementById('tomEscolhido').textContent = tom.nome;
      trocarFoto(tom.imagem);
      provador?.selecionarTom(tom);
      const foto = document.getElementById('produtoFoto');
      if (foto) foto.alt = `${produto.nome} — ${tom.nome}`;
    });
  });

  // Quantidade
  let qtd = 1;
  const qtdValor = document.getElementById('qtdValor');
  document.getElementById('qtdMais').addEventListener('click', () => {
    qtd = Math.min(qtd + 1, Math.max(estoque, 1));
    qtdValor.textContent = qtd;
  });
  document.getElementById('qtdMenos').addEventListener('click', () => {
    qtd = Math.max(qtd - 1, 1);
    qtdValor.textContent = qtd;
  });

  document.getElementById('btnFavoritar').addEventListener('click', () => alternarFavorito(produto));

  document.getElementById('btnAdicionar').addEventListener('click', () => {
    const item = {
      ...produto,
      estoqueProduto: { quantidade_atual: estoque },
      tom: tom ? tom.nome : '',
      imagem_url: (tom && tom.imagem) || produto.imagem_url
    };
    if (addToCart(item, qtd)) {
      showToast(`${produto.nome}${tom ? ' — ' + tom.nome : ''} adicionado à sacola`);
      const btn = document.getElementById('btnAdicionar');
      btn.classList.add('added');
      setTimeout(() => btn.classList.remove('added'), 1400);
    }
  });

  // Carrossel do produto: os demais itens da mesma categoria
  const relacionadosEl = document.getElementById('produtoRelacionados');
  if (!relacionadosEl || !categoria) return;
  try {
    const todos = await apiGet('/produtos');
    const mesmos = todos.filter(p => p.idCategoria === produto.idCategoria && p.codProduto !== produto.codProduto);
    if (mesmos.length) {
      relacionadosEl.appendChild(criarCarrossel({
        titulo: `Mais de ${categoria}`,
        descricao: produto.categoriaProduto.descricao || '',
        produtos: mesmos,
        categoria
      }));
    }
  } catch (err) {
    // Sem carrossel se a listagem falhar; o produto continua visível
  }
}

/* ==========================================
   PÁGINAS INSTITUCIONAIS (pagina.html?p=)
   ========================================== */
const PAGINAS = {
  sobre: 'Sobre a BE YOU',
  trocas: 'Trocas e devoluções',
  entrega: 'Prazos de entrega',
  pagamento: 'Formas de pagamento',
  contato: 'Fale conosco',
  privacidade: 'Política de privacidade',
  termos: 'Termos de uso'
};

async function initPaginaInstitucional() {
  const corpo = document.getElementById('paginaCorpo');
  if (!corpo) return;

  const chave = new URLSearchParams(location.search).get('p');
  const pagina = PAGINAS[chave] ? chave : 'sobre';
  const titulo = PAGINAS[pagina];

  document.title = `${titulo} — BE YOU Maquiagem`;
  document.getElementById('paginaTitulo').textContent = titulo;
  document.getElementById('paginaMigalha').textContent = titulo;

  document.getElementById('paginaMenu').innerHTML = Object.entries(PAGINAS).map(([p, t]) =>
    `<li><a href="pagina.html?p=${p}" ${p === pagina ? 'aria-current="page"' : ''}>${esc(t)}</a></li>`
  ).join('');

  const conteudo = await carregarConteudo();
  if (!conteudo || !conteudo[`pagina_${pagina}`]) {
    corpo.innerHTML = '<p class="vitrine-aviso erro">Não foi possível carregar esta página agora. Tente novamente em instantes.</p>';
    return;
  }
  if (pagina === 'sobre') {
    renderizarSobre(corpo, conteudo);
  } else {
    renderizarTexto(corpo, conteudo[`pagina_${pagina}`]);
  }
}

function renderizarSobre(corpo, conteudo) {
  corpo.closest('.pagina-institucional').classList.add('sobre-pagina');
  document.getElementById('paginaTitulo').hidden = true;
  corpo.innerHTML = `
    <section class="sobre-capa sobre-capa-sem-foto" aria-labelledby="sobreTitulo">
      <div class="sobre-capa-texto">
        <span class="secao-eyebrow">Publicidade e maquiagem · Desde 2026</span>
        <h1 id="sobreTitulo">Toda beleza tem uma história.<br><em>Esta é a nossa.</em></h1>
        <p>A BE YOU nasceu da minha vontade de unir publicidade e maquiagem. De cada propaganda e de cada produto testado no meu rosto, surgiu uma ideia: criar uma marca que inspire você a ser quem é.</p>
        <a class="historia-link" href="#nossaOrigem">Conheça nossa trajetória <span aria-hidden="true">↓</span></a>
        <span class="sobre-assinatura">BE YOU <small>MAQUIAGEM COM IDENTIDADE</small></span>
      </div>
    </section>
    <div class="sobre-manifesto"><span aria-hidden="true">✦</span><p>A maquiagem muda.<br><em>A sua essência fica.</em></p><span aria-hidden="true">✦</span></div>
    <section class="sobre-origem" id="nossaOrigem" aria-labelledby="sobreOrigemTitulo">
      <div class="sobre-origem-visual">
        <img class="sobre-foto-base" src="${esc(conteudo.historia_imagem || '../img_base/base_medio03.png')}" alt="Base BE YOU: o cuidado começa pelo tom certo" loading="lazy">
        <img class="sobre-foto-batom" src="${esc(conteudo.historia_imagem_3 || '../img_batom/batom_nude-claro.png')}" alt="Batom BE YOU em tom nude" loading="lazy">
        <span class="sobre-origem-selo">Da minha experiência<br><em>para a sua rotina.</em></span>
      </div>
      <div class="sobre-origem-texto"><span class="secao-eyebrow">O começo de tudo</span><h2 id="sobreOrigemTitulo">Publicidade e maquiagem.<br><em>Uma ideia com identidade.</em></h2><div class="sobre-narrativa" id="sobreNarrativa"></div></div>
    </section>
    <section class="sobre-trajetoria" aria-labelledby="sobreTrajetoriaTitulo">
      <div class="sobre-secao-topo"><span class="secao-eyebrow">Nosso caminho</span><h2 id="sobreTrajetoriaTitulo">Crescemos com <em>você.</em></h2></div>
      <ol class="sobre-linha">
        <li><span class="sobre-ano">2026</span><h3>Uma ideia ganha forma</h3><p>Publicidade e maquiagem se encontram nas propagandas que crio e nos produtos que testo no meu rosto.</p></li>
        <li><span class="sobre-ano">BE YOU</span><h3>Seja você</h3><p>Da vontade de transformar essa experiência em uma marca, nasce uma mensagem de liberdade, autenticidade e expressão.</p></li>
        <li><span class="sobre-ano">Hoje</span><h3>A história continua</h3><p>A história continua com diferentes tons de pele, novas descobertas e o interesse por tecnologias que aproximam maquiagem e cuidado.</p></li>
      </ol>
    </section>
    <section class="sobre-valores" aria-labelledby="sobreValoresTitulo">
      <div class="sobre-secao-topo"><span class="secao-eyebrow">O que nos move</span><h2 id="sobreValoresTitulo">Beleza com <em>sentido.</em></h2></div>
      <div class="sobre-valores-grid">
        <article><span>01 / LIBERDADE</span><h3>Sua beleza, suas escolhas.</h3><p>Maquiagem é expressão. Um toque discreto ou uma cor intensa: quem decide como se mostrar é você.</p></article>
        <article><span>02 / DIVERSIDADE</span><h3>O seu tom importa.</h3><p>Uma curadoria que considera diferentes peles e estilos, para que encontrar o favorito seja um momento de descoberta.</p></article>
        <article><span>03 / PROXIMIDADE</span><h3>Cuidado em cada detalhe.</h3><p>Da escolha do produto à sua rotina de beleza, queremos tornar a experiência simples, acolhedora e sem complicação.</p></article>
      </div>
    </section>
    <section class="sobre-convite"><span class="secao-eyebrow">O próximo capítulo é seu</span><h2>Encontre a sua<br><em>versão favorita.</em></h2><p>Conheça as cores e texturas que fazem parte da nossa história — e podem fazer parte da sua.</p><a class="btn btn-primary" href="index.html#catalogo">Descobrir a BE YOU <span aria-hidden="true">↗</span></a></section>
  `;
  renderizarTexto(document.getElementById('sobreNarrativa'), conteudo.pagina_sobre);
}

// Funções globais usadas por checkout.html e perfil.html
window.validaCpfClient = validaCpfClient;
window.getToken = getToken;
window.getUser = getUser;
window.getCart = () => cart;
window.clearCart = () => { cart = []; saveCart(); updateCartUI(); };

// Zoom somente na foto principal da página do produto.
function initZoomProdutos() {
  if (!document.getElementById('produtoPagina')) return;
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const seletor = '#produtoPagina .produto-foto';
  let ativo = null;
  let pausado = null;
  function limpar() {
    if (!ativo) return;
    ativo.classList.remove('produto-zoom-ativo');
    ativo.style.removeProperty('--zoom-x');
    ativo.style.removeProperty('--zoom-y');
    ativo = null;
  }
  function posicionar(evento) {
    const area = ativo.getBoundingClientRect();
    if (!area.width || !area.height) return;
    const x = Math.max(0, Math.min(100, (evento.clientX - area.left) / area.width * 100));
    const y = Math.max(0, Math.min(100, (evento.clientY - area.top) / area.height * 100));
    ativo.style.setProperty('--zoom-x', x + '%');
    ativo.style.setProperty('--zoom-y', y + '%');
  }
  document.addEventListener('pointerover', evento => {
    if (!mouse.matches || evento.pointerType !== 'mouse') return;
    const area = evento.target.closest(seletor);
    if (!area || !area.querySelector('img') || ativo === area || pausado === area) return;
    limpar();
    ativo = area;
    posicionar(evento);
    ativo.classList.add('produto-zoom-ativo');
  });
  document.addEventListener('pointermove', evento => {
    if (ativo && evento.pointerType === 'mouse') posicionar(evento);
  });
  document.addEventListener('click', evento => {
    const area = evento.target.closest(seletor);
    if (!ativo || area !== ativo) return;
    // O clique fecha o zoom até o mouse sair da foto.
    evento.preventDefault();
    limpar();
    pausado = area;
    pausado.classList.add('produto-zoom-pausado');
  });
  document.addEventListener('pointerout', evento => {
    if (pausado && pausado.contains(evento.target) && !pausado.contains(evento.relatedTarget)) {
      pausado.classList.remove('produto-zoom-pausado');
      pausado = null;
    }
    if (ativo && ativo.contains(evento.target) && !ativo.contains(evento.relatedTarget)) limpar();
  });
  mouse.addEventListener('change', limpar);
  window.addEventListener('blur', limpar);
}
