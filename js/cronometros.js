// js/cronometros.js — 10 cronómetros independientes

const MAX_CRONOS = 10;

// Array donde se guardan todos los cronómetros
let cronos = [];

// Objeto donde se guardan los setInterval de cada uno
// (cada cronómetro tiene su propio interval separado)
let intervalos = {};

// Nombres por defecto según la posición
const NOMBRES_DEFAULT = [
  'Matemáticas', 'Historia', 'Biología', 'Física',
  'Inglés', 'Programación', 'Literatura', 'Química',
  'Repaso general', 'Tarea pendiente'
];

// ── Crear objeto de un cronómetro nuevo ──────────────
function crearCronoObj(posicion) {
  return {
    id:            Date.now() + Math.random(), // ID único
    nombre:        NOMBRES_DEFAULT[posicion] || `Cronómetro ${posicion + 1}`,
    minutos:       25,           // tiempo configurado por el usuario
    totalSegundos: 25 * 60,      // total en segundos (para la barra de progreso)
    restantes:     25 * 60,      // segundos que faltan
    activo:        false,        // si está corriendo ahora mismo
    completado:    false,        // si ya terminó
  };
}

// ── Agregar un cronómetro nuevo ──────────────────────
function agregarCronometro() {
  if (cronos.length >= MAX_CRONOS) {
    toast('Máximo 10 cronómetros permitidos', 'error');
    return;
  }
  cronos.push(crearCronoObj(cronos.length));
  renderCronos();
}

// ── Dibujar todos los cronómetros en pantalla ────────
function renderCronos() {
  const grid = document.getElementById('cronometros-grid');
  const contador = document.getElementById('crono-contador');
  if (!grid) return;

  // Actualizar el contador "X / 10"
  if (contador) contador.textContent = `${cronos.length} / ${MAX_CRONOS}`;

  // Si no hay ninguno mostrar estado vacío
  if (!cronos.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span>⏱</span>
        <p>Presiona "+ Nuevo cronómetro" para agregar uno</p>
      </div>`;
    return;
  }

  // Dibujar cada cronómetro
  grid.innerHTML = cronos.map((c, i) => {

    // Formatear tiempo: 25:00, 04:33, etc.
    const min = Math.floor(c.restantes / 60).toString().padStart(2, '0');
    const seg = (c.restantes % 60).toString().padStart(2, '0');

    // Calcular porcentaje de la barra de progreso
    const pct = c.totalSegundos > 0
      ? Math.round(((c.totalSegundos - c.restantes) / c.totalSegundos) * 100)
      : 0;

    // Clases CSS según el estado
    let clases = 'crono-card';
    if (c.activo)    clases += ' activo';
    if (c.completado) clases += ' completado';

    // Texto del estado
    let estadoTexto = '⏸ En pausa';
    if (c.activo)    estadoTexto = '▶ Corriendo';
    if (c.completado) estadoTexto = '✅ Listo';

    // Texto del botón play/pausa
    const btnPlayTexto = c.activo ? '⏸ Pausar' : '▶ Iniciar';

    return `
    <div class="${clases}" id="crono-card-${c.id}">

      <!-- Nombre editable -->
      <input
        class="crono-nombre"
        type="text"
        value="${c.nombre}"
        placeholder="Nombre del cronómetro"
        onchange="renombrarCrono(${i}, this.value)"
        ${c.activo ? 'disabled' : ''}
      />

      <!-- Display del tiempo -->
      <div class="crono-display">${min}:${seg}</div>

      <!-- Barra de progreso -->
      <div class="crono-progreso">
        <div class="crono-progreso-fill"
             style="width:${pct}%">
        </div>
      </div>

      <!-- Configuración de minutos y estado -->
      <div class="crono-config">
        <label>Min:</label>
        <input
          type="number"
          min="1"
          max="120"
          value="${c.minutos}"
          onchange="cambiarTiempoCrono(${i}, this.value)"
          ${c.activo || c.completado ? 'disabled' : ''}
        />
        <span class="crono-estado">${estadoTexto}</span>
      </div>

      <!-- Botones -->
      <div class="crono-btns">
        <button
          class="btn-crono-play"
          onclick="toggleCrono(${i})"
          ${c.completado ? 'disabled style="opacity:0.4"' : ''}>
          ${btnPlayTexto}
        </button>
        <button
          class="btn-crono-reset"
          onclick="resetCrono(${i})"
          title="Reiniciar">
          ↺
        </button>
        <button
          class="btn-crono-del"
          onclick="eliminarCrono(${i})"
          title="Eliminar">
          🗑
        </button>
      </div>

    </div>`;
  }).join('');
}

// ── Iniciar o pausar un cronómetro ───────────────────
function toggleCrono(i) {
  const c = cronos[i];

  // Si ya completó no hace nada
  if (c.completado) return;

  if (c.activo) {
    // ── PAUSAR ──
    clearInterval(intervalos[c.id]);
    c.activo = false;
    renderCronos();

  } else {
    // ── INICIAR ──
    c.activo = true;

    intervalos[c.id] = setInterval(() => {
      c.restantes--;

      // Actualizar solo el display de este cronómetro
      // sin redibujar toda la grilla (más eficiente)
      actualizarDisplayCrono(c);

      // Si llegó a cero
      if (c.restantes <= 0) {
        c.restantes  = 0;
        c.activo     = false;
        c.completado = true;
        clearInterval(intervalos[c.id]);
        playNotifCrono();
        toast(`⏰ "${c.nombre}" completado!`);
        renderCronos(); // redibujar para mostrar estado completado
      }
    }, 1000);

    renderCronos();
  }
}

// ── Actualizar solo el display de un cronómetro ──────
// (sin redibujar toda la grilla para no perder el foco)
function actualizarDisplayCrono(c) {
  const card = document.getElementById(`crono-card-${c.id}`);
  if (!card) return;

  // Actualizar tiempo
  const display = card.querySelector('.crono-display');
  if (display) {
    const min = Math.floor(c.restantes / 60).toString().padStart(2, '0');
    const seg = (c.restantes % 60).toString().padStart(2, '0');
    display.textContent = `${min}:${seg}`;
  }

  // Actualizar barra de progreso
  const fill = card.querySelector('.crono-progreso-fill');
  if (fill && c.totalSegundos > 0) {
    const pct = Math.round(
      ((c.totalSegundos - c.restantes) / c.totalSegundos) * 100
    );
    fill.style.width = `${pct}%`;
  }
}

// ── Reiniciar un cronómetro ──────────────────────────
function resetCrono(i) {
  const c = cronos[i];

  // Detener el interval si estaba corriendo
  clearInterval(intervalos[c.id]);

  // Resetear estado
  c.activo     = false;
  c.completado = false;
  c.restantes  = c.minutos * 60;

  renderCronos();
}

// ── Eliminar un cronómetro ───────────────────────────
function eliminarCrono(i) {
  const c = cronos[i];

  // Detener el interval antes de eliminar
  clearInterval(intervalos[c.id]);

  // Quitar del array
  cronos.splice(i, 1);

  renderCronos();
  toast('🗑 Cronómetro eliminado');
}

// ── Renombrar un cronómetro ──────────────────────────
function renombrarCrono(i, nuevoNombre) {
  if (nuevoNombre.trim()) {
    cronos[i].nombre = nuevoNombre.trim();
  }
}

// ── Cambiar el tiempo de un cronómetro ───────────────
function cambiarTiempoCrono(i, valor) {
  // Asegurarse que sea entre 1 y 120 minutos
  const min = Math.max(1, Math.min(120, parseInt(valor) || 25));

  cronos[i].minutos       = min;
  cronos[i].restantes     = min * 60;
  cronos[i].totalSegundos = min * 60;
  cronos[i].completado    = false;

  renderCronos();
}

// ── Sonido de notificación ───────────────────────────
function playNotifCrono() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Tres tonos ascendentes
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.18);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.36);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {
    // Si el navegador bloquea el audio simplemente no suena
  }
}

// ── Inicializar con 3 cronómetros por defecto ────────
document.addEventListener('DOMContentLoaded', () => {
  // Empezar con 3 cronómetros ya listos
  for (let i = 0; i < 3; i++) {
    cronos.push(crearCronoObj(i));
  }
  renderCronos();
});