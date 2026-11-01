'use strict';
/* GoonRose: layered, trust-driven dress-up prototype.
   Rose is an adult (mid-20s) relaxing on a seaside balcony. She chooses what
   she is comfortable with; her limit is her bikini, which is always worn. */

const SAVE_KEY = 'goonrose-save-v2';

// Clothing layers. `need` = trust Rose needs before she'll remove it.
// `requires` = layers that must already be off (they're covering it).
const ITEMS = [
  { id: 'sunglasses', name: 'Sunglasses',   icon: '🕶️', need: 8,  requires: [],
    off: 'Fine, you can see my eyes now. Happy? 😌' },
  { id: 'kimono',     name: 'Sheer Kimono', icon: '👘', need: 22, requires: [],
    off: 'It\'s getting warm out here anyway… ☀️' },
  { id: 'sandals',    name: 'Sandals',      icon: '👡', need: 35, requires: [],
    off: 'Ahh, the tiles are so cool on my feet.' },
  { id: 'shorts',     name: 'Denim Shorts', icon: '🩳', need: 55, requires: [],
    off: 'Good thing I wore my bikini underneath! 👙' },
  { id: 'tee',        name: 'Crop Tee',     icon: '👕', need: 78, requires: ['kimono'],
    off: 'Okay… you\'ve really earned this one. 💕' },
];

// Interactions. `anim` = CSS class suffix, `mood` = face, `gain` = base trust.
// `stock` = name of a limited counter in state.
const ACTIONS = [
  { id: 'wave', label: '👋 Wave', sub: '+1 trust', gain: 1, anim: 'wave', mood: 'smile', ms: 2600,
    lines: ['Hey you! 👋', 'Oh, hi! Come enjoy the view!', 'Hiii~'] },
  { id: 'compliment', label: '💬 Compliment', sub: '+3 trust', gain: 3, anim: 'giggle', mood: 'shy', ms: 1800,
    lines: ['Stop it, you\'re making me blush!', 'Hehe… you like the tattoos? 🌹', 'Nobody\'s said that to me all week…'] },
  { id: 'twirl', label: '🌀 Ask to twirl', sub: '+2 trust', gain: 2, anim: 'twirl', mood: 'smile', ms: 2300,
    lines: ['Ta-daa! How do I look?', 'Show-off mode: activated ✨', 'Careful, I might get dizzy!'] },
  { id: 'dance', label: '💃 Dance', sub: '+4 trust', gain: 4, anim: 'dance', mood: 'smile', ms: 4500,
    lines: ['Put some music on! 🎶', 'Beach-house party for two!', 'Come on, keep up!'] },
  { id: 'pose', label: '📸 Pose', sub: '+2 trust', gain: 2, anim: 'pose', mood: 'smile', ms: 2800,
    lines: ['Get the ocean in the shot! 😉', 'My good side, obviously.', 'Hands on hips, chin up!'] },
  { id: 'sun', label: '☀️ Soak up the sun', sub: '+2 trust', gain: 2, anim: 'sun', mood: 'neutral', ms: 2800,
    lines: ['Mmm… that sun feels amazing.', 'I could stay out here forever.', 'Listen to those waves… 🌊'] },
  { id: 'drink', label: '🍹 Bring a cocktail', sub: '+5 trust', gain: 5, anim: 'gift', mood: 'smile', ms: 2100, stock: 'drinks',
    lines: ['Ooh, is that for me? Cheers! 🍹', 'You remembered I like it fruity!', 'Okay, you\'re officially my favourite.'] },
  { id: 'rose', label: '🌹 Give a rose', sub: '+8 trust', gain: 8, anim: 'gift', mood: 'shy', ms: 2100, stock: 'roses',
    lines: ['A rose? For me?! 🌹', 'It matches my tattoos…', 'You\'re going to make me melt!'] },
];

const DECLINE = [
  'Not yet. I barely know you! 😳',
  'Hehe, slow down… earn it first.',
  'Ask me again when I trust you more.',
];
const BLOCKED = (names) => `Hold on, I'd have to take off my ${names} first!`;
const DONE_LINE = 'That\'s my comfort zone. The bikini stays on! 💕';

const $ = (s, el = document) => el.querySelector(s);
const svg = $('#rose');
const bubble = $('#bubble');
const pick = (a) => a[Math.floor(Math.random() * a.length)];

let state = load();
let busy = false;
let bubbleTimer;

function fresh() {
  return { trust: 0, roses: 3, drinks: 2, worn: Object.fromEntries(ITEMS.map(i => [i.id, true])), last: null, streak: 0 };
}
function load() {
  const base = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
    return { ...base, ...saved, worn: { ...base.worn, ...(saved.worn || {}) } };
  } catch { return base; }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {} }

/* ---------- scene life: sparkles + ripples on the sea ---------- */
function buildSea() {
  const NS = 'http://www.w3.org/2000/svg';
  const sparks = $('#sparkles'), waves = $('#waves');
  const star = 'M0 -6 L1.2 -1.2 L6 0 L1.2 1.2 L0 6 L-1.2 1.2 L-6 0 L-1.2 -1.2Z';
  for (let i = 0; i < 55; i++) {
    // sun is upper-right, so the glitter path clusters to the right
    const x = 420 + Math.pow(Math.random(), 0.6) * 580;
    const y = 480 + Math.random() * 400;
    const s = 0.35 + ((y - 480) / 400) * 0.9 * Math.random() + 0.2;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', star); p.setAttribute('class', 'spark');
    p.style.animationDelay = (-Math.random() * 2.6).toFixed(2) + 's';
    p.style.animationDuration = (1.8 + Math.random() * 1.8).toFixed(2) + 's';
    g.appendChild(p); sparks.appendChild(g);
  }
  for (let i = 0; i < 34; i++) {
    const y = 482 + Math.pow(Math.random(), 1.4) * 400;
    const depth = (y - 470) / 400;           // 0 = horizon, 1 = near
    const x = Math.random() * 1000, len = 12 + depth * 70;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${x.toFixed(0)} ${y.toFixed(0)} h${len.toFixed(0)}`);
    p.setAttribute('stroke-width', (0.8 + depth * 2.2).toFixed(1));
    p.setAttribute('class', 'ripple');
    p.style.animationDelay = (-Math.random() * 7).toFixed(2) + 's';
    waves.appendChild(p);
  }
}

/* ---------- UI ---------- */
function say(text, ms = 3200) {
  bubble.textContent = text;
  bubble.classList.add('on');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
}

function setMood(m) { svg.dataset.mood = m; }
const restingMood = () => (state.trust >= 50 ? 'smile' : 'neutral');

function play(anim, mood, ms) {
  return new Promise(res => {
    busy = true; render();
    setMood(mood);
    const cls = 'a-' + anim;
    svg.classList.remove(cls); void svg.getBoundingClientRect(); // restart
    svg.classList.add(cls);
    setTimeout(() => {
      svg.classList.remove(cls);
      setMood(restingMood());
      busy = false; render(); res();
    }, ms);
  });
}

function render() {
  $('#trust-fill').style.width = state.trust + '%';
  $('#trust-num').textContent = Math.round(state.trust);

  const a = $('#actions');
  a.innerHTML = '';
  ACTIONS.forEach(act => {
    const b = document.createElement('button');
    const left = act.stock ? ` (${state[act.stock]} left)` : '';
    b.innerHTML = `${act.label}<small>${act.sub}${left}</small>`;
    b.disabled = busy || (act.stock && state[act.stock] <= 0);
    b.onclick = () => doAction(act);
    a.appendChild(b);
  });

  const w = $('#wardrobe');
  w.innerHTML = '';
  ITEMS.forEach(it => {
    const worn = state.worn[it.id];
    const layer = $('#c-' + it.id);
    if (!layer.classList.contains('removing') && !layer.classList.contains('dressing'))
      layer.classList.toggle('hidden', !worn);
    const b = document.createElement('button');
    const ready = state.trust >= it.need;
    b.className = worn ? '' : 'off';
    b.innerHTML = `${it.icon} ${it.name}<small>${worn ? (ready ? 'Ready to ask' : `Needs ${it.need} trust`) : 'Off: tap to put back on'}</small>`;
    b.disabled = busy;
    b.onclick = () => toggle(it.id);
    w.appendChild(b);
  });
}

/* ---------- gameplay ---------- */
async function doAction(act) {
  if (busy) return;
  if (act.stock) { if (state[act.stock] <= 0) return; state[act.stock]--; }

  // repeating the same thing is less charming
  state.streak = state.last === act.id ? state.streak + 1 : 0;
  state.last = act.id;
  const gain = act.gain * Math.max(0.25, 1 - state.streak * 0.3);
  const before = state.trust;
  state.trust = Math.min(100, state.trust + gain);
  save();
  say(pick(act.lines));
  await play(act.anim, act.mood, act.ms);

  const unlocked = ITEMS.filter(i => state.worn[i.id] && before < i.need && state.trust >= i.need);
  if (unlocked.length) say(`💗 Rose is now comfortable removing her ${unlocked.map(i => i.name.toLowerCase()).join(' and ')}.`, 3600);
}

async function toggle(id) {
  if (busy) return;
  const it = ITEMS.find(i => i.id === id);
  const layer = $('#c-' + id);

  // put back on: always allowed
  if (!state.worn[id]) {
    state.worn[id] = true; save();
    layer.classList.remove('hidden');
    layer.classList.add('dressing');
    say(`Back on goes the ${it.name.toLowerCase()}!`);
    setMood('smile');
    setTimeout(() => { layer.classList.remove('dressing'); render(); }, 700);
    render();
    return;
  }

  const covering = it.requires.filter(r => state.worn[r]);
  if (covering.length) {
    say(BLOCKED(covering.map(r => ITEMS.find(i => i.id === r).name.toLowerCase()).join(' and ')));
    await play('no', 'shy', 1300);
    return;
  }
  if (state.trust < it.need) {
    say(pick(DECLINE) + ` (needs ${it.need} trust)`);
    await play('no', 'shy', 1300);
    return;
  }

  // consent given → animated removal
  state.worn[id] = false; save();
  busy = true; setMood('shy');
  say(it.off);
  layer.classList.add('removing');
  render();
  setTimeout(() => {
    layer.classList.remove('removing');
    layer.classList.add('hidden');
    busy = false;
    setMood('smile');
    render();
    if (ITEMS.every(i => !state.worn[i.id])) say(DONE_LINE, 5000);
  }, 950);
}

/* clicking Rose's clothes directly */
document.querySelectorAll('.cloth').forEach(el =>
  el.addEventListener('click', () => toggle(el.dataset.id)));

/* ---------- boot ---------- */
$('#gate-yes').onclick = () => {
  $('#age-gate').hidden = true; $('#game').hidden = false;
  try { sessionStorage.setItem('goonrose-18', '1'); } catch {}
  start();
};
$('#gate-no').onclick = () => { location.href = 'about:blank'; };
$('#reset').onclick = () => {
  if (!confirm('Reset all progress?')) return;
  state = fresh(); save();
  document.querySelectorAll('.cloth').forEach(c => c.classList.remove('hidden', 'removing', 'dressing'));
  setMood('neutral'); render(); say('Hi! I\'m Rose. Welcome to my balcony! 🌊');
};

function start() {
  setMood(restingMood());
  render();
  say(state.trust ? 'Welcome back! 🌹' : 'Hi! I\'m Rose. Welcome to my balcony! 🌊');
}

buildSea();
try { if (sessionStorage.getItem('goonrose-18')) { $('#age-gate').hidden = true; $('#game').hidden = false; start(); } } catch {}
