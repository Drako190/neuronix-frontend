// js/habitos.js — Neuronix
let todosLosHabitos = [];
let misHabitos = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) return window.location.href = '/index.html';

  const user = getUser();
  document.getElementById('user-nombre').textContent = user?.nombre || '';

  await cargarHabitos();

  // Filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtrarHabitos(btn.dataset.cat);
    });
  });

  // Búsqueda
  document.getElementById('search-habitos')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = todosLosHabitos.filter(h =>
      h.nombre.toLowerCase().includes(q) || h.descripcion?.toLowerCase().includes(q)
    );
    renderCatalogo(filtrados);
  });
});

async function cargarHabitos() {
  try {
    const [catalogoRes, misRes] = await Promise.all([
      apiFetch('/habits'),
      apiFetch('/habits/mis-habitos')
    ]);
    todosLosHabitos = catalogoRes.habitos || [];
    misHabitos = (misRes.habitos || []).map(uh => uh.habito_id || uh.habits?.id);
    renderMisHabitos(misRes.habitos || []);
    renderCatalogo(todosLosHabitos);
  } catch (e) { toast(e.message, 'error'); }
}

function renderCatalogo(habitos) {
  const container = document.getElementById('catalogo-habitos');
  if (!container) return;
  if (!habitos.length) {
    container.innerHTML = `<div class="empty-state"><span>🔍</span><p>No se encontraron hábitos</p></div>`;
    return;
  }
  container.innerHTML = habitos.map(h => {
    const yaAdoptado = misHabitos.includes(h.id);
    return `
    <div class="habit-catalog-card" style="--accent:${h.color}">
      <div class="hcc-header">
        <span class="hcc-icon">${h.icono}</span>
        <span class="hcc-badge badge-${h.dificultad}">${h.dificultad}</span>
      </div>
      <h3>${h.nombre}</h3>
      <p>${h.descripcion || ''}</p>
      <div class="hcc-meta">
        <span>⏱ ${h.duracion_min}min</span>
        <span>✨ +${h.puntos}pts</span>
        <span>🏷 ${h.categoria}</span>
      </div>
      <button class="btn-adoptar ${yaAdoptado ? 'adopted' : ''}"
        onclick="adoptarHabito('${h.id}')"
        ${yaAdoptado ? 'disabled' : ''}>
        ${yaAdoptado ? '✅ Adoptado' : '+ Agregar'}
      </button>
    </div>`;
  }).join('');
}

function renderMisHabitos(userHabits) {
  const container = document.getElementById('mis-habitos-list');
  if (!container) return;
  if (!userHabits.length) {
    container.innerHTML = `<div class="empty-state"><span>💡</span><p>Selecciona hábitos del catálogo para empezar</p></div>`;
    return;
  }
  container.innerHTML = userHabits.map(uh => {
    const h = uh.habits;
    return `
    <div class="my-habit-row" style="border-left:4px solid ${h.color}">
      <span class="mhr-icon">${h.icono}</span>
      <div class="mhr-info">
        <strong>${h.nombre}</strong>
        <small>${h.categoria} · ${h.frecuencia}</small>
      </div>
      <span class="mhr-pts">+${h.puntos}pts</span>
      <button class="btn-remove" onclick="eliminarHabito('${h.id}')">🗑</button>
    </div>`;
  }).join('');
}

function filtrarHabitos(cat) {
  const filtrados = cat === 'todos' ? todosLosHabitos
    : todosLosHabitos.filter(h => h.categoria === cat);
  renderCatalogo(filtrados);
}

async function adoptarHabito(habitoId) {
  try {
    const data = await apiFetch(`/habits/adoptar/${habitoId}`, { method: 'POST' });
    toast(data.message);
    await cargarHabitos();
  } catch (e) { toast(e.message, 'error'); }
}

async function eliminarHabito(habitoId) {
  if (!confirm('¿Eliminar este hábito de tu lista?')) return;
  try {
    const data = await apiFetch(`/habits/mis-habitos/${habitoId}`, { method: 'DELETE' });
    toast(data.message);
    await cargarHabitos();
  } catch (e) { toast(e.message, 'error'); }
}
