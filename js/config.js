// js/config.js — Neuronix Frontend
const CONFIG = {
  // Cambia esta URL cuando hagas deploy del backend
  API_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://neuronix-api.onrender.com/api', // ← tu URL de Render aquí
};

// ── Token helpers ──────────────────────────────
function getToken() { return localStorage.getItem('neuronix_token'); }
function setToken(t) { localStorage.setItem('neuronix_token', t); }
function removeToken() { localStorage.removeItem('neuronix_token'); }
function getUser() {
  const u = localStorage.getItem('neuronix_user');
  return u ? JSON.parse(u) : null;
}
function setUser(u) { localStorage.setItem('neuronix_user', JSON.stringify(u)); }
function removeUser() { localStorage.removeItem('neuronix_user'); }

function isLoggedIn() { return !!getToken(); }

function logout() {
  removeToken(); removeUser();
  window.location.href = '/index.html';
}

// ── Fetch helper ──────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(CONFIG.API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// ── Toast notifications ───────────────────────
function toast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.innerHTML = `<span>${msg}</span>`;
  document.getElementById('toast-container')?.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}
