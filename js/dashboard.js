// js/dashboard.js — Neuronix
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) return window.location.href = '/index.html';
  cargarTablaPorcentajes();

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

async function cargarTablaPorcentajes() {
  try {
    const { logs } = await apiFetch('/habits/logs/semana');
    const { habitos } = await apiFetch('/habits/mis-habitos');
    const el = document.getElementById('tabla-porcentajes');
    if (!habitos.length) {
      el.innerHTML = `<div class="empty-state"><span>📊</span><p>Agrega habitos para ver tu progreso</p></div>`;
      return;
    }

    // Contar completados por hábito en los últimos 7 días
    const conteo = {};
    logs.forEach(l => {
      if (l.completado) {
        conteo[l.habito_id] = (conteo[l.habito_id] || 0) + 1;
      }
    });

    const colores = {
      100: { fill: '00B894', badge: 'rgba(0,184,148,0.2)', color: '00B894', label: 'Excelente' },
      75:  { fill: '6C63FF', badge: 'rgba(108,99,255,0.2)', color: '9B94FF', label: 'Muy bien' },
      50:  { fill: '00E5FF', badge: 'rgba(0,229,255,0.15)', color: '00E5FF', label: 'Regular' },
      25:  { fill: 'FDCB6E', badge: 'rgba(253,203,110,0.2)', color: 'FDCB6E', label: 'Bajo' },
      0:   { fill: 'FF6B6B', badge: 'rgba(255,107,107,0.15)', color: 'FF6B6B', label: 'Sin inicio' },
    };

    const getColor = pct => {
      if (pct >= 100) return colores[100];
      if (pct >= 75)  return colores[75];
      if (pct >= 50)  return colores[50];
      if (pct >= 25)  return colores[25];
      return colores[0];
    };

    const filas = habitos.map(uh => {
      const h = uh.habits;
      // Días esperados en la semana según frecuencia
      const esperados = h.frecuencia === 'diario' ? 7 : (h.dias_semana?.length || 1);
      const completados = conteo[h.id] || 0;
      const pct = Math.min(Math.round((completados / esperados) * 100), 100);
      const col = getColor(pct);
      return { h, completados, esperados, pct, col };
    }).sort((a, b) => b.pct - a.pct);

    el.innerHTML = `
    <table class="tabla-progreso">
      <thead>
        <tr>
          <th>Habito</th>
          <th>Categoria</th>
          <th style="width:220px">Progreso semanal</th>
          <th style="text-align:center">Dias</th>
          <th style="text-align:center">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${filas.map(({ h, completados, esperados, pct, col }) => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:0.6rem">
              <span style="font-size:1.2rem">${h.icono}</span>
              <strong style="font-size:0.88rem">${h.nombre}</strong>
            </div>
          </td>
          <td style="text-transform:capitalize;color:var(--text-m)">${h.categoria}</td>
          <td>
            <div class="pct-bar-wrap">
              <div class="pct-bar">
                <div class="pct-fill" style="width:${pct}%;background:#${col.fill}"></div>
              </div>
              <span class="pct-num" style="color:#${col.color}">${pct}%</span>
            </div>
          </td>
          <td style="text-align:center;font-family:var(--font-mono);font-size:0.85rem">
            ${completados}/${esperados}
          </td>
          <td style="text-align:center">
            <span class="pct-badge" style="background:${col.badge};color:#${col.color}">
              ${col.label}
            </span>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) { console.error(e); }
}