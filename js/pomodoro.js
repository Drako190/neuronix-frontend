// js/pomodoro.js — Neuronix Timer
let timerInterval = null;
let segundosRestantes = 25 * 60;
let timerActivo = false;
let ciclosCompletados = 0;
let modoActual = 'trabajo'; // 'trabajo' | 'descanso'

const CONFIG_TIMER = {
  trabajo: 25,
  descanso: 5,
  descansoLargo: 15,
};

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) return window.location.href = '/index.html';

  const user = getUser();
  document.getElementById('user-nombre').textContent = user?.nombre || '';

  actualizarDisplay();

  document.getElementById('btn-start')?.addEventListener('click', toggleTimer);
  document.getElementById('btn-reset')?.addEventListener('click', resetTimer);
  document.getElementById('btn-skip')?.addEventListener('click', saltarFase);

  // Configuración de tiempos
  document.getElementById('dur-trabajo')?.addEventListener('change', (e) => {
    CONFIG_TIMER.trabajo = parseInt(e.target.value);
    if (modoActual === 'trabajo') resetTimer();
  });
  document.getElementById('dur-descanso')?.addEventListener('change', (e) => {
    CONFIG_TIMER.descanso = parseInt(e.target.value);
    if (modoActual === 'descanso') resetTimer();
  });

  // Cargar stats
  cargarStats();
});

function toggleTimer() {
  if (timerActivo) {
    pausarTimer();
  } else {
    iniciarTimer();
  }
}

function iniciarTimer() {
  timerActivo = true;
  document.getElementById('btn-start').textContent = '⏸ Pausar';
  document.getElementById('timer-circle')?.classList.add('running');

  timerInterval = setInterval(() => {
    segundosRestantes--;
    actualizarDisplay();

    if (segundosRestantes <= 0) {
      completarFase();
    }
  }, 1000);
}

function pausarTimer() {
  timerActivo = false;
  clearInterval(timerInterval);
  document.getElementById('btn-start').textContent = '▶ Continuar';
  document.getElementById('timer-circle')?.classList.remove('running');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerActivo = false;
  segundosRestantes = CONFIG_TIMER[modoActual] * 60;
  document.getElementById('btn-start').textContent = '▶ Iniciar';
  document.getElementById('timer-circle')?.classList.remove('running');
  actualizarDisplay();
}

function saltarFase() {
  clearInterval(timerInterval);
  timerActivo = false;
  completarFase(false);
}

function completarFase(guardar = true) {
  clearInterval(timerInterval);
  timerActivo = false;

  // Notificación sonido / visual
  playNotification();

  if (modoActual === 'trabajo') {
    ciclosCompletados++;
    document.getElementById('ciclos-count').textContent = ciclosCompletados;
    toast(`🍅 ¡Pomodoro ${ciclosCompletados} completado! Toma un descanso.`);

    if (guardar) guardarSesion();

    // Cambiar a descanso
    modoActual = ciclosCompletados % 4 === 0 ? 'descansoLargo' : 'descanso';
  } else {
    toast('💪 ¡Descanso terminado! A trabajar.');
    modoActual = 'trabajo';
  }

  segundosRestantes = CONFIG_TIMER[modoActual] * 60;
  document.getElementById('btn-start').textContent = '▶ Iniciar';
  document.getElementById('timer-mode').textContent = modoActual === 'trabajo' ? '🍅 Enfoque' : '☕ Descanso';
  document.getElementById('timer-circle')?.classList.remove('running');
  actualizarDisplay();
}

function actualizarDisplay() {
  const min = Math.floor(segundosRestantes / 60).toString().padStart(2, '0');
  const seg = (segundosRestantes % 60).toString().padStart(2, '0');
  document.getElementById('timer-display').textContent = `${min}:${seg}`;

  // Progreso circular
  const total = CONFIG_TIMER[modoActual] * 60;
  const pct = (total - segundosRestantes) / total;
  const circle = document.querySelector('.progress-ring__circle');
  if (circle) {
    const r = circle.r.baseVal.value;
    const circunf = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${circunf} ${circunf}`;
    circle.style.strokeDashoffset = circunf - pct * circunf;
  }

  // Título de pestaña
  document.title = `${Math.floor(segundosRestantes/60).toString().padStart(2,'0')}:${(segundosRestantes%60).toString().padStart(2,'0')} — Neuronix`;
}

async function guardarSesion() {
  try {
    const materia = document.getElementById('materia-input')?.value || '';
    await apiFetch('/pomodoro', {
      method: 'POST',
      body: JSON.stringify({
        duracion_min: CONFIG_TIMER.trabajo,
        ciclos: 1, completado: true, materia
      })
    });
  } catch (e) { console.error('Error guardando pomodoro:', e); }
}

async function cargarStats() {
  try {
    const stats = await apiFetch('/pomodoro/stats');
    document.getElementById('total-pomodoros').textContent = stats.semana?.sesionesPomodoro || 0;
    document.getElementById('minutos-estudio').textContent = stats.semana?.minutosPomodoro || 0;
  } catch {}
}

function playNotification() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}
