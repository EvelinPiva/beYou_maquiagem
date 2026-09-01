const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initModals();
  initCart();
  initAuth();
  initProducts();
  initProductModal();
});

/* ==========================================
   MOBILE MENU
   ========================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
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
        if (window.innerWidth <= 860) {
          if (!item.classList.contains('mega-open')) {
            e.preventDefault();
            document.querySelectorAll('.nav-item.mega-open').forEach(i => i !== item && i.classList.remove('mega-open'));
            item.classList.add('mega-open');
          } else {
            mainNav.classList.remove('open');
            menuToggle.classList.remove('open');
          }
        }
      });
    });

    document.querySelectorAll('.mega a').forEach(a => {
      a.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.classList.remove('open');
      });
    });
  }
}

/* ==========================================
   TOAST NOTIFICATION
   ========================================== */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
}

/* ==========================================
   MODALS CONTROLLER
   ========================================== */
function initModals() {
  const overlay = document.getElementById('modalOverlay');
  
  function openModal(id) {
    const m = document.getElementById(id);
    if(m) {
      overlay.classList.add('active');
      m.classList.add('active');
    }
  }

  function closeAllModals() {
    overlay.classList.remove('active');
    document.querySelectorAll('.modal.active, .cart-drawer.open').forEach(el => {
      el.classList.remove('active', 'open');
    });
  }

  // Setup close buttons
  document.querySelectorAll('.modal-close, #closeCart').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  if(overlay) overlay.addEventListener('click', closeAllModals);

  // Toggle Passwords
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });

  // Switch between Login and Cadastro
  const btnIrCadastro = document.getElementById('irParaCadastro');
  const btnIrLogin = document.getElementById('irParaLogin');
  if(btnIrCadastro) {
    btnIrCadastro.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => openModal('modalCadastro'), 300);
    });
  }
  if(btnIrLogin) {
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
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(produto) {
  // Check stock
  if (produto.estoqueProduto && produto.estoqueProduto.quantidade_atual <= 0) {
    showToast('Produto esgotado.');
    return false;
  }

  const existing = cart.find(item => item.codProduto === produto.codProduto);
  if (existing) {
    if (produto.estoqueProduto && existing.quantidade >= produto.estoqueProduto.quantidade_atual) {
       showToast('Estoque máximo atingido.');
       return false;
    }
    existing.quantidade += 1;
  } else {
    cart.push({ ...produto, quantidade: 1 });
  }
  
  saveCart();
  updateCartUI();
  return true;
}

function removeFromCart(id) {
  cart = cart.filter(item => item.codProduto !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.codProduto === id);
  if (item) {
    const newQty = item.quantidade + delta;
    if (newQty <= 0) {
      removeFromCart(id);
    } else {
      // In a real scenario, we'd check against actual stock again here
      item.quantidade = newQty;
      saveCart();
      updateCartUI();
    }
  }
}

function updateCartUI() {
  const countEls = document.querySelectorAll('#cartCount, #cartDrawerCount');
  const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
  countEls.forEach(el => { if(el) el.textContent = totalItems });

  const cartList = document.getElementById('cartList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');
  
  if (!cartList) return; // not on a page with cart UI

  if (cart.length === 0) {
    cartList.innerHTML = '';
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
  } else {
    cartEmpty.style.display = 'none';
    cartFooter.style.display = 'block';
    
    let subtotal = 0;
    cartList.innerHTML = cart.map(item => {
      const preco = parseFloat(item.preco);
      subtotal += preco * item.quantidade;
      return `
        <li class="cart-item">
          <div class="cart-item-thumb">
            ${item.imagem_url ? `<img src="${item.imagem_url}" alt="${item.nome}">` : '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="20" y="14" width="24" height="36" rx="4"/></svg>'}
          </div>
          <div class="cart-item-info">
            <h4 class="cart-item-name">${item.nome}</h4>
            <div class="cart-item-price">R$ ${preco.toFixed(2).replace('.',',')}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="changeQty(${item.codProduto}, -1)">-</button>
              <span class="cart-qty">${item.quantidade}</span>
              <button class="qty-btn" onclick="changeQty(${item.codProduto}, 1)">+</button>
              <button class="cart-item-remove" onclick="removeFromCart(${item.codProduto})">Remover</button>
            </div>
          </div>
        </li>
      `;
    }).join('');

    const frete = subtotal >= 150 ? 0 : 15.90;
    const total = subtotal + frete;

    document.getElementById('cartSubtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.',',')}`;
    document.getElementById('cartFrete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.',',')}`;
    document.getElementById('cartTotal').textContent = `R$ ${total.toFixed(2).replace('.',',')}`;
    
    const freteHint = document.getElementById('freteHint');
    if (frete === 0) {
      freteHint.textContent = 'Você ganhou frete grátis! 🎉';
      freteHint.style.color = '#38a169';
    } else {
      const faltam = 150 - subtotal;
      freteHint.textContent = `Faltam R$ ${faltam.toFixed(2).replace('.',',')} para frete grátis.`;
      freteHint.style.color = 'var(--taupe)';
    }
  }
}

function initCart() {
  updateCartUI();
  
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('modalOverlay');

  if(cartBtn && cartDrawer) {
    cartBtn.addEventListener('click', () => {
      if(window.closeAllModals) window.closeAllModals();
      overlay.classList.add('active');
      cartDrawer.classList.add('open');
    });
  }

  const btnContShop = document.getElementById('btnContShop');
  if(btnContShop) {
    btnContShop.addEventListener('click', (e) => {
      e.preventDefault();
      window.closeAllModals();
    });
  }
}

/* ==========================================
   AUTH & CPF VALIDATION
   ========================================== */
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

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
  const user = getUser();
  const contaBtnLabel = document.getElementById('contaBtnLabel');
  const contaBtn = document.getElementById('contaBtn');
  const adminLink = document.getElementById('adminLink');
  const perfilNome = document.getElementById('perfilNome');
  
  // Novos links de navegação adicionados
  const navLoginTop = document.getElementById('navLoginTop');
  const navGestaoTop = document.getElementById('navGestaoTop');

  if (user) {
    if (contaBtnLabel) contaBtnLabel.textContent = user.nome.split(' ')[0];
    if (perfilNome) perfilNome.textContent = user.nome;
    if (navLoginTop) navLoginTop.style.display = 'none';
    
    if (user.tipo_usuario === 'ADMIN') {
      if (adminLink) adminLink.style.display = 'flex';
      if (navGestaoTop) navGestaoTop.style.display = 'block';
    }
  } else {
    // Usuário não logado
    if (navLoginTop) navLoginTop.style.display = 'block';
    if (navGestaoTop) navGestaoTop.style.display = 'none';
  }

  if (contaBtn) {
    contaBtn.addEventListener('click', () => {
      if (getUser()) {
        window.openModal('modalPerfil');
      } else {
        window.openModal('modalLogin');
      }
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

  // Login Form
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

  // CPF Input mask and validation
  const cadCPF = document.getElementById('cadCPF');
  const cpfHint = document.getElementById('cpfHint');
  if (cadCPF) {
    cadCPF.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0,11);
      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
      e.target.value = v;

      if(v.replace(/\D/g, '').length === 11) {
        if(validaCpfClient(v)) {
          cpfHint.textContent = 'CPF válido ✓';
          cpfHint.className = 'field-hint ok';
          cadCPF.classList.add('valid');
          cadCPF.classList.remove('invalid');
        } else {
          cpfHint.textContent = 'CPF inválido ✗';
          cpfHint.className = 'field-hint err';
          cadCPF.classList.add('invalid');
          cadCPF.classList.remove('valid');
        }
      } else {
        cpfHint.textContent = '';
        cadCPF.classList.remove('valid', 'invalid');
      }
    });
  }

  // Cadastro Form
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
      
      if(!validaCpfClient(cpf)) {
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
   PRODUCTS LOAD
   ========================================== */
async function initProducts() {
  // If we are on a page that needs products fetched
  const productSection = document.getElementById('rosto'); 
  if(!productSection) return; // simple check if we are on index

  // Em um caso real, faríamos um fetch aqui para carregar os produtos do banco e substituir os hardcoded.
  // Para manter a UI inicial sem backend rodando, vamos apenas anexar os eventos aos botões existentes.
  
  // Attach events to existing hardcoded cards for demo purposes
  document.querySelectorAll('.card').forEach(card => {
    const btn = card.querySelector('[data-add]');
    const wish = card.querySelector('[data-wish]');
    
    if(wish) {
      wish.addEventListener('click', () => wish.classList.toggle('active'));
    }

    if(btn) {
      btn.addEventListener('click', () => {
        const nome = card.querySelector('.card-name').textContent;
        const precoStr = card.querySelector('.price-now').textContent.replace('R$','').trim().replace(',','.');
        const cat = card.querySelector('.card-cat').textContent;
        
        // Mock a product object for the cart
        const prod = {
          codProduto: Math.floor(Math.random() * 1000), // fake id for static HTML
          nome: nome,
          preco: precoStr,
          imagem_url: '', // would use real URL if from API
          estoqueProduto: { quantidade_atual: 10 } // assume in stock
        };

        if(addToCart(prod)) {
           btn.textContent = 'Adicionado ✓';
           btn.classList.add('added');
           setTimeout(() => {
             btn.textContent = 'Adicionar à sacola';
             btn.classList.remove('added');
           }, 1400);
           showToast(`${nome} adicionado`);
        }
      });
    }
  });
}

// Global functions for checkout
window.validaCpfClient = validaCpfClient;
window.getToken = getToken;
window.getUser = getUser;
window.getCart = () => cart;
window.clearCart = () => { cart = []; saveCart(); updateCartUI(); };

/* ==========================================
   PRODUCT DETAIL MODAL
   ========================================== */
function initProductModal() {
  const overlay   = document.getElementById('productModalOverlay');
  const modal     = document.getElementById('productModal');
  const closeBtn  = document.getElementById('productModalClose');

  if (!modal || !overlay) return;

  // State
  let currentImages  = [];
  let currentImgIdx  = 0;
  let currentQty     = 1;
  let currentProduct = null;

  /* ---- Open / Close ---- */
  function openProductModal(card) {
    // Gather data from card attributes
    const name      = card.querySelector('.card-name')?.textContent  || '';
    const cat       = card.querySelector('.card-cat')?.textContent   || '';
    const priceNow  = card.querySelector('.price-now')?.textContent  || '';
    const priceOld  = card.querySelector('.price-old')?.textContent  || '';
    const badgeEl   = card.querySelector('.badge-off');
    const badge     = badgeEl ? badgeEl.textContent : '';
    const desc      = card.dataset.modalDesc || 'Produto BE YOU de alta qualidade, formulado para realçar sua beleza natural com muito pigmento e durabilidade.';
    const imagesRaw = card.dataset.modalImages || '';
    const shadesRaw = card.dataset.modalShades || '[]';

    // Images list — use card's own image or fallback to SVG placeholder
    currentImages = imagesRaw
      ? imagesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // If the card has a real <img>, add it first if not already in the list
    const cardImg = card.querySelector('.card-media img');
    if (cardImg && currentImages.length === 0) {
      currentImages.push(cardImg.src);
    }

    // Price string → numeric
    const numericPrice = parseFloat(
      priceNow.replace('R$','').trim().replace(',','.')
    ) || 0;

    currentProduct = {
      codProduto: card.dataset.prodId || Math.floor(Math.random() * 90000 + 10000),
      nome: name,
      preco: numericPrice,
      categoria: cat,
      imagem_url: currentImages[0] || '',
      estoqueProduto: { quantidade_atual: 10 }
    };

    // --- Populate UI ---
    document.getElementById('pmBreadcrumb').textContent = `BE YOU · ${cat}`;
    document.getElementById('pmTitle').textContent       = name;

    // Prices
    const priceNowEl = document.getElementById('pmPriceNow');
    const priceOldEl = document.getElementById('pmPriceOld');
    const installEl  = document.getElementById('pmInstallments');
    priceNowEl.textContent = priceNow;
    if (priceOld) {
      priceOldEl.textContent = priceOld;
      priceOldEl.style.display = 'inline';
    } else {
      priceOldEl.textContent = '';
      priceOldEl.style.display = 'none';
    }
    // Installments (3x sem juros)
    if (numericPrice > 0) {
      const installVal = (numericPrice / 3).toFixed(2).replace('.', ',');
      installEl.textContent = `ou 3× de R$ ${installVal} sem juros`;
    }

    // Badge
    const pmBadge = document.getElementById('pmBadge');
    if (badge) {
      pmBadge.textContent = badge;
      pmBadge.classList.add('visible');
    } else {
      pmBadge.textContent = '';
      pmBadge.classList.remove('visible');
    }

    // Description
    document.getElementById('pmDesc').textContent = desc;

    // Gallery
    currentImgIdx = 0;
    renderGallery();

    // Shades
    let shades = [];
    try { shades = JSON.parse(shadesRaw); } catch(e) {}
    renderSwatches(shades);

    // Qty reset
    currentQty = 1;
    document.getElementById('pmQtyVal').textContent = '1';

    // Wishlist state
    const pmWish = document.getElementById('pmWishBtn');
    const cardWish = card.querySelector('[data-wish]');
    pmWish.classList.toggle('active', cardWish && cardWish.classList.contains('active'));

    // Show
    document.body.style.overflow = 'hidden';
    overlay.classList.add('open');
    modal.classList.add('open');
  }

  function closeProductModal() {
    overlay.classList.remove('open');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---- Gallery ---- */
  function renderGallery() {
    const mainImg = document.getElementById('pmMainImg');
    const thumbsEl = document.getElementById('pmThumbs');

    if (currentImages.length === 0) {
      mainImg.src = '';
      mainImg.alt = '';
      thumbsEl.innerHTML = '';
      document.getElementById('pmPrev').style.display = 'none';
      document.getElementById('pmNext').style.display = 'none';
      return;
    }

    mainImg.style.opacity = '0';
    mainImg.src = currentImages[currentImgIdx];
    mainImg.onload = () => { mainImg.style.opacity = '1'; };
    mainImg.onerror = () => { mainImg.style.opacity = '1'; };

    // Show/hide nav
    const showNav = currentImages.length > 1;
    document.getElementById('pmPrev').style.display = showNav ? 'flex' : 'none';
    document.getElementById('pmNext').style.display = showNav ? 'flex' : 'none';

    // Thumbnails
    thumbsEl.innerHTML = currentImages.map((src, i) => `
      <button class="pm-thumb ${i === currentImgIdx ? 'active' : ''}" data-idx="${i}" aria-label="Ver imagem ${i+1}">
        <img src="${src}" alt="Imagem ${i+1}" loading="lazy">
      </button>
    `).join('');

    thumbsEl.querySelectorAll('.pm-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        currentImgIdx = parseInt(btn.dataset.idx);
        renderGallery();
      });
    });
  }

  function goImg(delta) {
    if (currentImages.length === 0) return;
    currentImgIdx = (currentImgIdx + delta + currentImages.length) % currentImages.length;
    renderGallery();
  }

  document.getElementById('pmPrev').addEventListener('click', () => goImg(-1));
  document.getElementById('pmNext').addEventListener('click', () => goImg(+1));

  /* ---- Swatches ---- */
  function renderSwatches(shades) {
    const block = document.getElementById('pmShadesBlock');
    const swatchesEl = document.getElementById('pmSwatches');
    const selectedEl = document.getElementById('pmSelectedShade');

    if (!shades || shades.length === 0) {
      block.style.display = 'none';
      return;
    }
    block.style.display = 'flex';

    let activeIdx = 0;
    selectedEl.textContent = shades[0].name;

    swatchesEl.innerHTML = shades.map((s, i) => `
      <button
        class="pm-swatch ${i === 0 ? 'active' : ''}"
        style="background:${s.color}"
        data-idx="${i}"
        data-name="${s.name}"
        data-img="${s.img || ''}"
        title="${s.name}"
        aria-label="${s.name}"
      ></button>
    `).join('');

    swatchesEl.querySelectorAll('.pm-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        swatchesEl.querySelectorAll('.pm-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeIdx = parseInt(btn.dataset.idx);
        selectedEl.textContent = btn.dataset.name;

        // If this shade has its own image, update main image
        if (btn.dataset.img) {
          const imgIdx = currentImages.indexOf(btn.dataset.img);
          if (imgIdx >= 0) {
            currentImgIdx = imgIdx;
          } else {
            // Insert at front temporarily
            currentImages.unshift(btn.dataset.img);
            currentImgIdx = 0;
          }
          renderGallery();
        }
      });
    });
  }

  /* ---- Qty ---- */
  document.getElementById('pmQtyPlus').addEventListener('click', () => {
    currentQty = Math.min(currentQty + 1, 10);
    document.getElementById('pmQtyVal').textContent = currentQty;
  });
  document.getElementById('pmQtyMinus').addEventListener('click', () => {
    currentQty = Math.max(currentQty - 1, 1);
    document.getElementById('pmQtyVal').textContent = currentQty;
  });

  /* ---- Add to cart from modal ---- */
  document.getElementById('pmAddBtn').addEventListener('click', () => {
    if (!currentProduct) return;
    let added = false;
    for (let i = 0; i < currentQty; i++) {
      added = addToCart({ ...currentProduct });
      if (!added) break;
    }
    if (added) {
      const btn = document.getElementById('pmAddBtn');
      btn.textContent = 'Adicionado ✓';
      btn.classList.add('added');
      showToast(`${currentProduct.nome} adicionado à sacola`);
      setTimeout(() => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg> Adicionar à Sacola`;
        btn.classList.remove('added');
      }, 1600);
    }
  });

  /* ---- Wishlist from modal ---- */
  document.getElementById('pmWishBtn').addEventListener('click', () => {
    const btn = document.getElementById('pmWishBtn');
    btn.classList.toggle('active');
  });

  /* ---- Click on card to open ---- */
  document.querySelectorAll('.card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't open if clicking wishlist, add btn, or shade dots
      if (
        e.target.closest('[data-wish]') ||
        e.target.closest('[data-add]') ||
        e.target.closest('.shade-dot')
      ) return;
      openProductModal(card);
    });
  });

  /* ---- Close triggers ---- */
  closeBtn.addEventListener('click', closeProductModal);
  overlay.addEventListener('click', closeProductModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeProductModal();
  });
}

