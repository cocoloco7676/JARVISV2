const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const logs = $('#logList');
const toastEl = $('#toast');
const brainCanvas = $('#brainCanvas');
const brainCtx = brainCanvas.getContext('2d');

const state = {
  muted: false,
  voice: localStorage.getItem('jarvis.voice') || 'de-CH',
  particles: [],
  moving: true,
};

function time() {
  return new Date().toLocaleTimeString('de-DE', { hour12: false });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function addLog(message, type = 'USER') {
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${time()}</span><span class="log-type ${type === 'JARVIS' ? 'jarvis' : ''}">${type}</span><span>${escapeHtml(message)}</span>`;
  logs.appendChild(line);
  logs.scrollTop = logs.scrollHeight;
  $('#logCount').textContent = `${logs.children.length} EVENTS`;
}

function setActiveView(viewName) {
  const views = $$('.view');
  views.forEach((view) => {
    const isActive = view.id === viewName;
    view.classList.toggle('active', isActive);
    view.setAttribute('aria-hidden', String(!isActive));
  });
  const dashboardVisible = viewName === 'dashboardView';
  document.body.style.overflow = dashboardVisible ? '' : 'hidden';
}

function respond(command) {
  const input = command.trim();
  if (!input) return;

  addLog(input, 'USER');

  const lower = input.toLowerCase();
  let response = 'Command received. Neural pathways are standing by.';

  if (lower.includes('diagnos')) response = 'Diagnostics complete. No critical anomalies detected.';
  if (lower.includes('status')) response = 'All systems nominal. API gateway connected and secure.';
  if (lower.includes('joke')) response = 'Why did the robot get promoted? It had outstanding cache flow.';
  if (lower.includes('hello') || lower.includes('hi')) response = 'Good to see you, commander. Systems are ready.';

  setTimeout(() => {
    addLog(response, 'JARVIS');
    if (!state.muted) speak(response);
  }, 420);

  $('#commandInput').value = '';
  $('#logInput').value = '';
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.voice;

  const pickedVoice = speechSynthesis.getVoices().find((voice) =>
    voice.lang.toLowerCase().startsWith(state.voice.toLowerCase())
  );

  if (pickedVoice) utterance.voice = pickedVoice;

  utterance.onstart = () => {
    $('#mouthLight').classList.add('speaking');
  };

  utterance.onend = () => {
    $('#mouthLight').classList.remove('speaking');
  };

  speechSynthesis.speak(utterance);
}

function updateClock() {
  $('#clock').textContent = new Date().toLocaleTimeString('de-DE', { hour12: false });
}

function updateTelemetry() {
  const cpu = 34 + Math.round(Math.random() * 22);
  const memory = 62 + Math.round(Math.random() * 13);
  const latency = 18 + Math.round(Math.random() * 16);

  $('#cpuValue').textContent = `${cpu}%`;
  $('#cpuBar').style.width = `${cpu}%`;
  $('#memoryValue').textContent = `${memory}%`;
  $('#memoryBar').style.width = `${memory}%`;
  $('#networkValue').innerHTML = `${latency}<span>ms</span>`;
  $('#networkBar').style.width = `${Math.min(74, latency + 10)}%`;
}

function loadSettings() {
  const config = JSON.parse(localStorage.getItem('jarvis.config') || '{}');
  const savedVoice = localStorage.getItem('jarvis.voice') || 'de-CH';

  $('#baseUrl').value = config.baseUrl || 'http://localhost:3000/v1';
  $('#authToken').value = config.authToken || '';
  $('#voiceSelect').value = savedVoice;
  state.voice = savedVoice;
  $('#apiEndpoint').textContent = `${(config.baseUrl || 'LOCAL GATEWAY').replace(/^https?:\/\//i, '').toUpperCase()} · V1`;
}

function saveSettings() {
  const baseUrl = $('#baseUrl').value.trim() || 'http://localhost:3000/v1';
  const token = $('#authToken').value.trim();
  const voice = $('#voiceSelect').value;

  localStorage.setItem('jarvis.config', JSON.stringify({ baseUrl, authToken: token }));
  localStorage.setItem('jarvis.voice', voice);
  state.voice = voice;

  $('#apiEndpoint').textContent = `${baseUrl.replace(/^https?:\/\//i, '').toUpperCase()} · V1`;
  $('#saveMessage').textContent = 'Saved';
  setTimeout(() => $('#saveMessage').textContent = '', 1500);
  showToast('Configuration saved locally.');
}

function buildApiRequest(prompt) {
  const config = JSON.parse(localStorage.getItem('jarvis.config') || '{}');
  const baseUrl = config.baseUrl || 'http://localhost:3000/v1';
  const token = config.authToken || '';

  return {
    method: 'POST',
    url: `${baseUrl}/messages`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: 'claude-3-5-sonnet', messages: [{ role: 'user', content: prompt }] })
  };
}

function bindEvents() {
  $('#sendButton').addEventListener('click', () => respond($('#commandInput').value));

  $('#commandInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') respond(event.target.value);
  });

  $('#logInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      respond(event.target.value);
    }
  });

  $$('.suggestions button').forEach((button) => {
    button.addEventListener('click', () => respond(button.dataset.command));
  });

  $$('.quick-action').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'diagnostic') respond('Run a full system diagnostic');
      if (action === 'mute') {
        state.muted = !state.muted;
        $('#muteLabel').textContent = state.muted ? 'Audio output muted' : 'Audio output enabled';
        showToast(state.muted ? 'Voice output muted.' : 'Voice output enabled.');
        if (state.muted) speechSynthesis.cancel();
      }
      if (action === 'clear') {
        logs.innerHTML = '';
        $('#logCount').textContent = '0 EVENTS';
        showToast('Conversation buffer cleared.');
      }
      if (action === 'api') {
        showToast('API gateway is connected and operational.');
      }
    });
  });

  $('#brainButton').addEventListener('click', () => setActiveView('brainView'));
  $('#closeBrain').addEventListener('click', () => setActiveView('dashboardView'));
  $('#settingsButton').addEventListener('click', () => $('#settingsModal').showModal());
  $('#settingsButtonBrain').addEventListener('click', () => $('#settingsModal').showModal());
  $('#settingsButtonFromBrain').addEventListener('click', () => $('#settingsModal').showModal());

  $('#toggleToken').addEventListener('click', () => {
    const input = $('#authToken');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('#toggleToken').textContent = input.type === 'password' ? 'SHOW' : 'HIDE';
  });

  $('#settingsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    saveSettings();
    $('#settingsModal').close();
  });
}

function initBrainParticles() {
  const stage = $('.brain-stage');
  const width = stage.clientWidth;
  const height = stage.clientHeight;

  state.particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    r: Math.random() * 2.2 + 1,
    hue: Math.random() > 0.5 ? 190 : 42,
  }));
}

function drawBrainNetwork() {
  const brainStage = $('.brain-stage');
  const width = brainStage.clientWidth;
  const height = brainStage.clientHeight;

  brainCanvas.width = width * window.devicePixelRatio;
  brainCanvas.height = height * window.devicePixelRatio;
  brainCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  const cx = width / 2;
  const cy = height / 2;

  const nodePositions = {
    core: { x: cx, y: cy },
    memory: { x: width * 0.2, y: height * 0.35 },
    language: { x: width * 0.82, y: height * 0.35 },
    voice: { x: width * 0.27, y: height * 0.74 },
    tools: { x: width * 0.74, y: height * 0.74 }
  };

  brainCtx.clearRect(0, 0, width, height);

  brainCtx.strokeStyle = 'rgba(0,243,255,0.36)';
  brainCtx.lineWidth = 1.1;

  const connections = [
    ['core', 'memory'], ['core', 'language'], ['core', 'voice'], ['core', 'tools'],
    ['memory', 'voice'], ['language', 'tools'], ['memory', 'language'], ['voice', 'tools']
  ];

  connections.forEach(([a, b]) => {
    const from = nodePositions[a];
    const to = nodePositions[b];
    brainCtx.beginPath();
    brainCtx.moveTo(from.x, from.y);
    brainCtx.lineTo(to.x, to.y);
    brainCtx.stroke();
  });

  brainCtx.strokeStyle = 'rgba(255,215,0,0.22)';
  brainCtx.beginPath();
  brainCtx.arc(cx, cy, 180, 0, Math.PI * 2);
  brainCtx.stroke();

  if (!state.particles.length) initBrainParticles();

  state.particles.forEach((p, i) => {
    p.x += p.vx * 1.5;
    p.y += p.vy * 1.5;

    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;

    const alpha = 0.3 + ((i % 18) / 18);
    brainCtx.beginPath();
    brainCtx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
    brainCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    brainCtx.fill();
  });

  const pulse = 1 + Math.sin(Date.now() / 500) * 0.08;
  brainCtx.beginPath();
  brainCtx.strokeStyle = 'rgba(255,215,0,0.26)';
  brainCtx.lineWidth = 1.4;
  brainCtx.arc(cx, cy, 120 * pulse, 0, Math.PI * 2);
  brainCtx.stroke();
}

function animateBrain() {
  if (!document.getElementById('brainView').classList.contains('active')) return;
  drawBrainNetwork();
  requestAnimationFrame(animateBrain);
}

function init() {
  loadSettings();
  bindEvents();
  setActiveView('dashboardView');
  updateClock();
  updateTelemetry();
  setInterval(updateClock, 1000);
  setInterval(updateTelemetry, 3200);

  addLog('Neural interface initialized', 'SYSTEM');
  addLog('Secure API tunnel established', 'SYSTEM');
  addLog('Voice module ready · de-CH', 'SYSTEM');
  addLog('Awaiting your command...', 'JARVIS');

  initBrainParticles();
  drawBrainNetwork();
  requestAnimationFrame(animateBrain);
}

window.addEventListener('resize', () => {
  initBrainParticles();
  drawBrainNetwork();
});

init();
