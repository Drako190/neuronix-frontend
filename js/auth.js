// js/auth.js — Neuronix
document.addEventListener('DOMContentLoaded', () => {
  // Si ya está logueado y está en index, ir al dashboard
  if (isLoggedIn() && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
    window.location.href = '/pages/dashboard.html';
  }

  // ── Registro ──────────────────────────────────
  const formRegister = document.getElementById('form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formRegister.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Creando cuenta...';
      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
          })
        });
        setToken(data.token);
        setUser(data.usuario);
        toast('✅ Cuenta creada. ¡Bienvenido!');
        setTimeout(() => window.location.href = '/pages/dashboard.html', 1000);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Crear cuenta';
      }
    });
  }

  // ── Login ─────────────────────────────────────
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formLogin.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Entrando...';
      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
          })
        });
        setToken(data.token);
        setUser(data.usuario);
        toast(data.message);
        setTimeout(() => window.location.href = '/pages/dashboard.html', 800);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Iniciar sesión';
      }
    });
  }

  // ── Forgot Password ───────────────────────────
  const formForgot = document.getElementById('form-forgot');
  if (formForgot) {
    formForgot.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: document.getElementById('email').value })
        });
        toast('📧 Si el correo existe, recibirás instrucciones');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ── Logout ────────────────────────────────────
  document.getElementById('btn-logout')?.addEventListener('click', logout);

  // ── Mostrar nombre usuario en navbar ──────────
  const user = getUser();
  if (user) {
    const elNombre = document.getElementById('user-nombre');
    if (elNombre) elNombre.textContent = `${user.nombre} ${user.apellido}`;
    const elPuntos = document.getElementById('user-puntos');
    if (elPuntos) elPuntos.textContent = `${user.puntos_totales || 0} pts`;
  }
});
