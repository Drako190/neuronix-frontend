// js/metas.js — Neuronix
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) return window.location.href = '/index.html';
  const user = getUser();
  document.getElementById('user-nombre').textContent = user?.nombre || '';

  await cargarMetas();

  document.getElementById('btn-nueva-meta')?.addEventListener('click', () => {
    document.getElementById('modal-meta').classList.add('open');
  });
  document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => {
    document.getElementById('modal-meta').classList.remove('open');
  });
  document.getElementById('form-meta')?.addEventListener('submit', crearMeta);
});

async function cargarMetas() {
  try {
    const { metas } = await apiFetch('/goals');
    renderMetas(metas);
  } catch (e) { toast(e.message, 'error'); }
}

function renderMetas(metas) {
  const container = document.getElementById('metas-container');
  if (!container) return;

  if (!metas.length) {
    container.innerHTML = `<div class="empty-state"><span>🎯</span><p>No tienes metas aún. ¡Crea tu primera meta!</p></div>`;
    return;
  }

  const priorColors = { alta: '#FF6B6B', media: '#FDCB6E', baja: '#00B894' };
  container.innerHTML = metas.map(m => {
    const diasRestantes = m.fecha_limite
      ? Math.ceil((new Date(m.fecha_limite) - new Date()) / 86400000) : null;
    return `
    <div class="meta-card ${m.completado ? 'completada' : ''}">
      <div class="meta-header">
        <span class="prioridad-dot" style="background:${priorColors[m.prioridad]}"></span>
        <h3>${m.titulo}</h3>
        <div class="meta-actions">
          <button onclick="toggleMeta('${m.id}', ${m.completado})" title="${m.completado ? 'Reabrir' : 'Completar'}">
            ${m.completado ? '🔄' : '✅'}
          </button>
          <button onclick="eliminarMeta('${m.id}')" title="Eliminar">🗑</button>
        </div>
      </div>
      ${m.descripcion ? `<p class="meta-desc">${m.descripcion}</p>` : ''}
      <div class="meta-progreso">
        <div class="progreso-bar">
          <div class="progreso-fill" style="width:${m.progreso}%"></div>
        </div>
        <span>${m.progreso}%</span>
      </div>
      <input type="range" min="0" max="100" value="${m.progreso}"
        onchange="actualizarProgreso('${m.id}', this.value)"
        class="progreso-slider" ${m.completado ? 'disabled' : ''}>
      <div class="meta-footer">
        ${m.categoria ? `<span class="tag">📁 ${m.categoria}</span>` : ''}
        ${m.prioridad ? `<span class="tag">⚡ ${m.prioridad}</span>` : ''}
        ${diasRestantes !== null ? `<span class="tag ${diasRestantes < 3 ? 'urgente' : ''}">📅 ${diasRestantes > 0 ? diasRestantes + ' días' : 'Vencida'}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function crearMeta(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify({
        titulo: document.getElementById('meta-titulo').value,
        descripcion: document.getElementById('meta-desc').value,
        categoria: document.getElementById('meta-cat').value,
        fecha_limite: document.getElementById('meta-fecha').value || null,
        prioridad: document.getElementById('meta-prioridad').value,
      })
    });
    toast('🎯 Meta creada!');
    document.getElementById('modal-meta').classList.remove('open');
    e.target.reset();
    await cargarMetas();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function actualizarProgreso(id, progreso) {
  try {
    await apiFetch(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ progreso: parseInt(progreso) })
    });
    document.querySelector(`.meta-card [data-id="${id}"] .progreso-fill`);
    await cargarMetas();
  } catch {}
}

async function toggleMeta(id, completado) {
  try {
    await apiFetch(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completado: !completado, progreso: !completado ? 100 : undefined })
    });
    toast(!completado ? '🎉 ¡Meta completada!' : '🔄 Meta reabierta');
    await cargarMetas();
  } catch (e) { toast(e.message, 'error'); }
}

async function eliminarMeta(id) {
  if (!confirm('¿Eliminar esta meta?')) return;
  try {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
    toast('🗑 Meta eliminada');
    await cargarMetas();
  } catch (e) { toast(e.message, 'error'); }
}
