const ADMIN_API = 'http://localhost:3000/api';
const form = document.getElementById('adminLoginForm');
const errorMessage = document.getElementById('loginError');
const password = document.getElementById('senha');
const toggle = document.getElementById('togglePassword');
toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? 'Ocultar' : 'Mostrar';
  toggle.setAttribute('aria-pressed', String(visible));
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  const button = form.querySelector('[type="submit"]');
  const label = document.getElementById('submitLabel');
  button.disabled = true;
  label.textContent = 'Entrando…';
  try {
    const response = await fetch(`${ADMIN_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.elements.email.value.trim(), senha: password.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || 'Não foi possível entrar. Confira seus dados.');
    if (!data.token || data.usuario?.tipo_usuario !== 'ADMIN') {
      throw new Error('Acesso restrito a administradores. Utilize uma conta administrativa.');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    window.location.replace('admin.html');
  } catch (error) {
    errorMessage.textContent = error instanceof TypeError ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.' : error.message;
    errorMessage.hidden = false;
  } finally {
    button.disabled = false;
    label.textContent = 'Entrar';
  }
});