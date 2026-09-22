const $ = (selector) => document.querySelector(selector);
const logs = $('#logList');
const state = { muted: false, voice: localStorage.getItem('jarvis.voice') || 'de-CH' };

function time() { return new Date().toLocaleTimeString('de-DE', { hour12: false }); }
function addLog(message, type = 'USER') {
  const line = document.createElement('div'); line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${time()}</span><span class="log-type ${type === 'JARVIS' ? 'jarvis' : ''}">${type}</span><span>${escapeHtml(message)}</span>`;
  logs.append(line); logs.scrollTop = logs.scrollHeight;
  $('#logCount').textContent = `${logs.children.length} EVENTS`;
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2800); }

function respond(command) {
  if (!command.trim()) return;
  addLog(command.trim(), 'USER');
  const lower = command.toLowerCase();
  let response = 'Command received. Neural pathways are standing by.';
  if (lower.includes('diagnos')) response = 'Diagnostics complete. No critical anomalies detected.';
  if (lower.includes('status')) response = 'All systems nominal. API gateway connected and secure.';
  if (lower.includes('joke')) response = 'Why did the robot get promoted? It had outstanding cache flow.';
  setTimeout(() => { addLog(response, 'JARVIS'); if (!state.muted) speak(response); }, 450);
  $('#commandInput').value = '';
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = state.voice;
  const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(state.voice.toLowerCase()));
  if (voice) utterance.voice = voice;
  utterance.onstart = () => startAudioPulse(); utterance.onend = () => stopAudioPulse(); speechSynthesis.speak(utterance);
}
function startAudioPulse() { $('#mouthLight').classList.add('speaking'); $('#mouthLight').style.boxShadow = '0 0 32px 12px var(--cyan)'; }
function stopAudioPulse() { $('#mouthLight').classList.remove('speaking'); $('#mouthLight').style.boxShadow = ''; }

$('#sendButton').addEventListener('click', () => respond($('#commandInput').value));
$('#commandInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') respond(event.target.value); });
$('#logInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') { respond(event.target.value); event.target.value = ''; } });
document.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => respond(button.dataset.command)));
document.querySelectorAll('.quick-action').forEach((button) => button.addEventListener('click', () => {
  const action = button.dataset.action;
  if (action === 'diagnostic') respond('Run a full system diagnostic');
  if (action === 'mute') { state.muted = !state.muted; $('#muteLabel').textContent = state.muted ? 'Audio output muted' : 'Audio output enabled'; toast(state.muted ? 'Voice output muted.' : 'Voice output enabled.'); if (state.muted) speechSynthesis?.cancel(); }
  if (action === 'clear') { logs.innerHTML = ''; $('#logCount').textContent = '0 EVENTS'; toast('Conversation buffer cleared.'); }
  if (action === 'api') toast('API gateway is connected and operational.');
}));

const brainView = $('#brainView');
$('#brainButton').addEventListener('click', () => { brainView.classList.add('active'); brainView.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; });
$('#closeBrain').addEventListener('click', () => { brainView.classList.remove('active'); brainView.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; });
$('#settingsButton').addEventListener('click', () => $('#settingsModal').showModal());
$('#toggleToken').addEventListener('click', () => { const input = $('#authToken'); input.type = input.type === 'password' ? 'text' : 'password'; $('#toggleToken').textContent = input.type === 'password' ? 'SHOW' : 'HIDE'; });

const savedConfig = JSON.parse(localStorage.getItem('jarvis.config') || '{}');
$('#baseUrl').value = savedConfig.baseUrl || '';
$('#authToken').value = savedConfig.authToken || '';
$('#voiceSelect').value = state.voice;
$('#settingsForm').addEventListener('submit', (event) => { event.preventDefault(); localStorage.setItem('jarvis.config', JSON.stringify({ baseUrl: $('#baseUrl').value, authToken: $('#authToken').value })); state.voice = $('#voiceSelect').value; localStorage.setItem('jarvis.voice', state.voice); $('#apiEndpoint').textContent = `${($('#baseUrl').value || 'LOCAL GATEWAY').replace(/^https?:\/\//, '').toUpperCase()} · V1`; $('#settingsModal').close(); toast('Configuration saved locally.'); });

function updateTelemetry() {
  const cpu = 34 + Math.round(Math.random() * 22), memory = 64 + Math.round(Math.random() * 9), latency = 18 + Math.round(Math.random() * 15);
  $('#cpuValue').textContent = `${cpu}%`; $('#cpuBar').style.width = `${cpu}%`; $('#memoryValue').textContent = `${memory}%`; $('#memoryBar').style.width = `${memory}%`; $('#networkValue').innerHTML = `${latency}<span>ms</span>`; $('#networkBar').style.width = `${Math.min(70, latency)}%`;
}
function updateClock() { $('#clock').textContent = new Date().toLocaleTimeString('de-DE', { hour12: false }); }
setInterval(updateTelemetry, 3500); setInterval(updateClock, 1000); updateClock();
addLog('Neural interface initialized', 'SYSTEM'); addLog('Secure API tunnel established', 'SYSTEM'); addLog('Voice module ready · de-CH', 'SYSTEM'); addLog('Awaiting your command...', 'JARVIS');
