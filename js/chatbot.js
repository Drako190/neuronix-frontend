// js/chatbot.js — NeuroBot Widget para Neuronix
// Incluir este script en todas las páginas que necesiten el chatbot

(function () {
  // ── Historial de conversación (en memoria por sesión) ──
  let chatHistory = [];
  let isOpen = false;
  let isTyping = false;

  // ── Inyectar HTML del widget ──────────────────────────
  function injectWidget() {
    const html = `
      <!-- NeuroBot Floating Button -->
      <button id="nbot-toggle" aria-label="Abrir NeuroBot" title="NeuroBot — Asistente de estudio">
        <span id="nbot-icon-open">🧠</span>
        <span id="nbot-icon-close" style="display:none">✕</span>
        <span id="nbot-badge" style="display:none">1</span>
      </button>

      <!-- NeuroBot Chat Panel -->
      <div id="nbot-panel" aria-hidden="true">
        <!-- Header -->
        <div id="nbot-header">
          <div id="nbot-header-info">
            <div id="nbot-avatar">🧠</div>
            <div>
              <div id="nbot-title">NeuroBot</div>
              <div id="nbot-status">Coach de hábitos de estudio</div>
            </div>
          </div>
          <button id="nbot-clear" title="Limpiar conversación">🗑</button>
        </div>

        <!-- Messages -->
        <div id="nbot-messages" role="log" aria-live="polite"></div>

        <!-- Input -->
        <div id="nbot-input-area">
          <textarea
            id="nbot-input"
            placeholder="Pregúntame sobre hábitos de estudio..."
            rows="1"
            maxlength="500"
            aria-label="Mensaje para NeuroBot"
          ></textarea>
          <button id="nbot-send" aria-label="Enviar mensaje">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div id="nbot-footer">Powered by Gemini · Solo para temas de estudio</div>
      </div>

      <!-- Estilos del widget -->
      <style>
        /* ── Botón flotante ── */
        #nbot-toggle {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9998;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6C63FF, #00E5FF);
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(108,99,255,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        #nbot-toggle:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(108,99,255,0.7);
        }
        #nbot-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #FF6B9D;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body, sans-serif);
        }

        /* ── Panel ── */
        #nbot-panel {
          position: fixed;
          bottom: 100px;
          right: 28px;
          z-index: 9997;
          width: 360px;
          max-height: 540px;
          background: #111827;
          border: 1px solid rgba(108,99,255,0.3);
          border-radius: 18px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--font-body, 'Space Grotesk', sans-serif);
          opacity: 0;
          transform: translateY(16px) scale(0.97);
          pointer-events: none;
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        #nbot-panel.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        /* ── Header ── */
        #nbot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,229,255,0.1));
          border-bottom: 1px solid rgba(108,99,255,0.2);
        }
        #nbot-header-info { display: flex; align-items: center; gap: 10px; }
        #nbot-avatar {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #6C63FF, #00E5FF);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }
        #nbot-title {
          font-weight: 700; font-size: 0.95rem; color: #E8EAED;
          font-family: var(--font-head, 'Syne', sans-serif);
        }
        #nbot-status { font-size: 0.72rem; color: #00E5FF; }
        #nbot-clear {
          background: transparent; border: none; cursor: pointer;
          font-size: 1rem; opacity: 0.5; transition: opacity 0.15s;
          padding: 4px;
        }
        #nbot-clear:hover { opacity: 1; }

        /* ── Mensajes ── */
        #nbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(108,99,255,0.3) transparent;
        }
        .nbot-msg {
          max-width: 84%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.875rem;
          line-height: 1.55;
          color: #E8EAED;
          word-break: break-word;
          animation: nbotFadeIn 0.2s ease;
        }
        @keyframes nbotFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nbot-msg.bot {
          background: #1a2235;
          border: 1px solid rgba(108,99,255,0.2);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        .nbot-msg.user {
          background: linear-gradient(135deg, rgba(108,99,255,0.35), rgba(0,229,255,0.15));
          border: 1px solid rgba(108,99,255,0.3);
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        .nbot-msg.typing span {
          display: inline-block;
          width: 7px; height: 7px;
          background: #6C63FF;
          border-radius: 50%;
          margin: 0 2px;
          animation: nbotDot 1.2s infinite;
        }
        .nbot-msg.typing span:nth-child(2) { animation-delay: 0.2s; }
        .nbot-msg.typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes nbotDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* ── Sugerencias rápidas ── */
        #nbot-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 14px 10px;
        }
        .nbot-chip {
          background: rgba(108,99,255,0.15);
          border: 1px solid rgba(108,99,255,0.3);
          color: #9B94FF;
          padding: 5px 11px;
          border-radius: 20px;
          font-size: 0.76rem;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .nbot-chip:hover {
          background: rgba(108,99,255,0.3);
          color: #E8EAED;
        }

        /* ── Input ── */
        #nbot-input-area {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid rgba(108,99,255,0.15);
          background: #0E1220;
        }
        #nbot-input {
          flex: 1;
          background: #141928;
          border: 1px solid rgba(108,99,255,0.25);
          border-radius: 10px;
          color: #E8EAED;
          padding: 9px 12px;
          font-size: 0.875rem;
          font-family: var(--font-body, 'Space Grotesk', sans-serif);
          resize: none;
          max-height: 100px;
          overflow-y: auto;
          line-height: 1.4;
          outline: none;
          transition: border-color 0.15s;
        }
        #nbot-input:focus { border-color: rgba(108,99,255,0.6); }
        #nbot-input::placeholder { color: #5A6480; }
        #nbot-send {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #6C63FF, #00E5FF);
          border: none; border-radius: 10px;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
        }
        #nbot-send:hover { opacity: 0.85; transform: scale(1.05); }
        #nbot-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* ── Footer ── */
        #nbot-footer {
          text-align: center;
          font-size: 0.68rem;
          color: #5A6480;
          padding: 6px;
          background: #0E1220;
        }

        /* ── Responsive ── */
        @media (max-width: 420px) {
          #nbot-panel { width: calc(100vw - 20px); right: 10px; bottom: 90px; }
          #nbot-toggle { bottom: 18px; right: 18px; }
        }
      </style>
    `;

    const container = document.createElement('div');
    container.id = 'nbot-root';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // ── Renderizar un mensaje en el chat ──────────────────
  function appendMessage(text, role) {
    const messages = document.getElementById('nbot-messages');
    const msg = document.createElement('div');
    msg.className = `nbot-msg ${role}`;
    // Convertir saltos de línea en <br>
    msg.innerHTML = text.replace(/\n/g, '<br>');
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  // ── Mostrar indicador de "escribiendo" ────────────────
  function showTyping() {
    const messages = document.getElementById('nbot-messages');
    const el = document.createElement('div');
    el.className = 'nbot-msg bot typing';
    el.id = 'nbot-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('nbot-typing')?.remove();
  }

  // ── Mensaje de bienvenida ──────────────────────────────
  function showWelcome() {
    const user = typeof getUser === 'function' ? getUser() : null;
    const nombre = user?.nombre ? `, ${user.nombre.split(' ')[0]}` : '';
    appendMessage(
      `¡Hola${nombre}! 👋 Soy **NeuroBot**, tu coach de hábitos de estudio.\n\nPuedo ayudarte con técnicas de estudio, consejos para mantener rachas, gestión del tiempo y más. ¿En qué te ayudo hoy?`,
      'bot'
    );

    // Sugerencias rápidas
    const sugerencias = [
      '💡 Técnica Pomodoro',
      '🔥 Mantener rachas',
      '😓 Superar la procrastinación',
      '📚 Estudiar mejor',
    ];
    const chips = document.createElement('div');
    chips.id = 'nbot-suggestions';
    sugerencias.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'nbot-chip';
      chip.textContent = s;
      chip.addEventListener('click', () => {
        chips.remove();
        sendMessage(s);
      });
      chips.appendChild(chip);
    });
    document.getElementById('nbot-messages').appendChild(chips);
  }

  // ── Enviar mensaje a la API ───────────────────────────
  async function sendMessage(text) {
    if (isTyping || !text.trim()) return;

    const input = document.getElementById('nbot-input');
    const sendBtn = document.getElementById('nbot-send');

    // Limpiar sugerencias si existen
    document.getElementById('nbot-suggestions')?.remove();

    appendMessage(text, 'user');
    chatHistory.push({ role: 'user', text });

    input.value = '';
    input.style.height = 'auto';
    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('neuronix_token');
      const res = await fetch(`${typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '/api'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-10) }),
      });

      const data = await res.json();
      hideTyping();

      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      appendMessage(data.reply, 'bot');
      chatHistory.push({ role: 'bot', text: data.reply });

    } catch (err) {
      hideTyping();
      appendMessage('Oops, hubo un error al contactar el asistente. Intenta de nuevo en un momento. 🔌', 'bot');
      console.error('NeuroBot error:', err);
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Toggle del panel ──────────────────────────────────
  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('nbot-panel');
    const iconOpen  = document.getElementById('nbot-icon-open');
    const iconClose = document.getElementById('nbot-icon-close');
    const badge     = document.getElementById('nbot-badge');

    panel.classList.toggle('open', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));
    iconOpen.style.display  = isOpen ? 'none' : 'inline';
    iconClose.style.display = isOpen ? 'inline' : 'none';
    badge.style.display = 'none';

    if (isOpen) {
      // Mostrar bienvenida solo la primera vez
      if (chatHistory.length === 0) showWelcome();
      setTimeout(() => document.getElementById('nbot-input')?.focus(), 250);
    }
  }

  // ── Auto-resize del textarea ──────────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    // Solo mostrar si el usuario está logueado
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) return;

    injectWidget();

    document.getElementById('nbot-toggle').addEventListener('click', togglePanel);
    document.getElementById('nbot-clear').addEventListener('click', () => {
      chatHistory = [];
      document.getElementById('nbot-messages').innerHTML = '';
      showWelcome();
    });

    const input   = document.getElementById('nbot-input');
    const sendBtn = document.getElementById('nbot-send');

    sendBtn.addEventListener('click', () => sendMessage(input.value.trim()));

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });

    input.addEventListener('input', () => autoResize(input));
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
