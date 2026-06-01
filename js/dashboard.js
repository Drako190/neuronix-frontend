// js/dashboard.js — Neuronix
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) return window.location.href = '/index.html';

  const user = getUser();
  document.getElementById('user-nombre').textContent = user?.nombre || '';
  document.getElementById('user-puntos').textContent = `${user?.puntos_totales || 0} pts`;

  // Cargar estadísticas
  try {
    const stats = await apiFetch('/pomodoro/stats');
    renderStats(stats);
  } catch (e) { console.error(e); }

  // Cargar hábitos de hoy
  try {
    const { habitos } = await apiFetch('/habits/mis-habitos');
    const { logs } = await apiFetch('/habits/logs/hoy');
    renderHabitosHoy(habitos, logs);
  } catch (e) { console.error(e); }

  // Leaderboard
  try {
    const { ranking } = await apiFetch('/users/leaderboard');
    renderLeaderboard(ranking);
  } catch (e) { console.error(e); }
});

function renderStats(stats) {
  document.getElementById('stat-puntos').textContent = stats.usuario?.puntos_totales || 0;
  document.getElementById('stat-racha').textContent = stats.usuario?.racha_actual || 0;
  document.getElementById('stat-completados-hoy').textContent = stats.hoy?.completados || 0;
  document.getElementById('stat-pomodoros').textContent = stats.semana?.sesionesPomodoro || 0;

  // Gráfica semanal simple (barras CSS)
  const porDia = stats.semana?.porDia || {};
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const grafica = document.getElementById('grafica-semana');
  if (!grafica) return;
  grafica.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dia = new Date(Date.now() - i * 86400000).getDay();
    const val = porDia[fecha] || 0;
    const max = Math.max(...Object.values(porDia), 1);
    const pct = Math.round((val / max) * 100);
    grafica.innerHTML += `
      <div class="bar-item">
        <div class="bar-fill" style="height:${pct}%" data-val="${val}"></div>
        <span class="bar-label">${dias[dia]}</span>
      </div>`;
  }
}

function renderHabitosHoy(habitos, logs) {
  const container = document.getElementById('habitos-hoy');
  if (!container) return;
  if (!habitos.length) {
    container.innerHTML = `<div class="empty-state"><span>🌱</span><p>Aún no tienes hábitos. <a href="habitos.html">Agregar hábitos</a></p></div>`;
    return;
  }
  const logMap = {};
  logs.forEach(l => logMap[l.habito_id] = l);

  container.innerHTML = habitos.slice(0, 6).map(uh => {
    const h = uh.habits;
    const log = logMap[h.id];
    const done = log?.completado;
    return `
    <div class="habit-card ${done ? 'done' : ''}" data-id="${h.id}">
      <div class="habit-icon" style="background:${h.color}20;color:${h.color}">${h.icono}</div>
      <div class="habit-info">
        <h4>${h.nombre}</h4>
        <span class="habit-cat">${h.categoria} · ${h.duracion_min}min · +${h.puntos}pts</span>
      </div>
      <button class="btn-check ${done ? 'checked' : ''}" onclick="toggleHabito('${h.id}', ${done})">
        ${done ? '✅' : '⬜'}
      </button>
    </div>`;
  }).join('');
}

async function toggleHabito(habitoId, estaHecho) {
  try {
    const data = await apiFetch('/habits/log', {
      method: 'POST',
      body: JSON.stringify({ habito_id: habitoId, completado: !estaHecho })
    });
    toast(data.message);
    // Actualizar puntos en UI
    const user = getUser();
    if (user && !estaHecho) {
      // refrescar user
      const me = await apiFetch('/auth/me');
      setUser(me.usuario);
      document.getElementById('user-puntos').textContent = `${me.usuario.puntos_totales} pts`;
      document.getElementById('stat-puntos').textContent = me.usuario.puntos_totales;
    }
    // Recargar lista
    const { habitos } = await apiFetch('/habits/mis-habitos');
    const { logs } = await apiFetch('/habits/logs/hoy');
    renderHabitosHoy(habitos, logs);
  } catch (e) { toast(e.message, 'error'); }
}

function renderLeaderboard(ranking) {
  const el = document.getElementById('leaderboard');
  if (!el) return;
  el.innerHTML = ranking.map((u, i) => `
    <div class="rank-row ${i < 3 ? 'top3' : ''}">
      <span class="rank-pos">${['🥇','🥈','🥉'][i] || (i+1)}</span>
      <div class="rank-avatar">${u.nombre[0]}${u.apellido[0]}</div>
      <div class="rank-info">
        <strong>${u.nombre} ${u.apellido}</strong>
        <small>${u.nivel}</small>
      </div>
      <span class="rank-pts">${u.puntos_totales} pts</span>
    </div>`).join('');
}
