'use strict';
/* GoonRose — layered, trust-driven dress-up prototype.
   Rose is an adult (mid-20s). She chooses what she is comfortable with;
   her limit is lingerie, which is always worn. */

const SAVE_KEY = 'goonrose-save-v1';

// Clothing layers. `need` = trust Rose needs before she'll remove it.
// `requires` = layers that must already be off (they're covering it).
const ITEMS = [
  { id: 'scarf',     name: 'Silk Scarf', icon: '🧣', need: 10, requires: [] },
  { id: 'jacket',    name: 'Blazer',     icon: '🧥', need: 25, requires: [] },
  { id: 'shoes',     name: 'Heels',      icon: '👠', need: 35, requires: [] },
  { id: 'stockings', name: 'Stockings',  icon: '🧦', need: 50, requires: ['shoes'] },
  { id: 'skirt',     name: 'Skirt',      icon: '👗', need: 65, requires: [] },
  { id: 'top',       name: 'Blouse',     icon: '👚', need: 80, requires: ['jacket'] },
];

// Interactions. `anim` = CSS class suffix, `mood` = face, `gain` = base trust.
const ACTIONS = [
  { id: 'wave',   label: '👋 Wave',       sub: '+1 trust',  gain: 1, anim: 'wave',   mood: 'smile', ms: 2600,
    lines: ['Hi there! 👋', 'Oh, hello again!', 'Hey you~'] },
  { id: 'compliment', label: '💬 Compliment', sub: '+3 trust', gain: 3, anim: 'giggle', mood: 'shy', ms: 1800,
    lines: ['Oh stop it, you\'re making me blush!', 'Hehe… you\'re sweet.', 'Nobody\'s said that to me all week…'] },
  { id: 'twirl',  label: '🌀 Ask to twirl', sub: '+2 trust', gain: 2, anim: 'twirl',  mood: 'smile', ms: 2300,
    lines: ['Ta-daa! How do I look?', 'Show-off mode: activated ✨', 'Careful, I might get dizzy!'] },
  { id: 'dance',  label: '💃 Dance',      sub: '+4 trust',  gain: 4, anim: 'dance',  mood: 'smile', ms: 4500,
    lines: ['Put some music on! 🎶', 'I love this song!', 'Come on, keep up!'] },
  { id: 'pose',   label: '📸 Pose',       sub: '+2 trust',  gain: 2, anim: 'pose',   mood: 'smile', ms: 2700,
    lines: ['Camera\'s ready? 😉', 'My good side, obviously.', 'Smile!'] },
  { id: 'rose',   label: '🌹 Give a rose', sub: '+8 trust', gain: 8, anim: 'gift',   mood: 'shy', ms: 2100, limited: true,
    lines: ['A rose? For me?! 🌹', 'That\'s… really thoughtful.', 'You\'re going to make me melt!'] },
];

const DECLINE = [
  'Not yet — I barely know you! 😳',
  'Hehe, slow down… earn it first.',
  'Ask me again when I trust you more.',
];
const CONSENT = [
  'Okay… just this once. 😊',
  'You\'ve earned it. Don\'t make it weird!',
  'Alright, I\'m comfortable with that.',
];
const BLOCKED = (names) => `Hold on — I\'d have to take off my ${names} first!`;
const DONE_LINE = 'That\'s my comfort zone — lingerie\'s as far as I go. 💕';

const $ = (s, el = document) => el.querySelector(s);
const svg = $('#rose');
const bubble = $('#bubble');
const pick = (a) => a[Math.floor(Math.random() * a.length)];

let state = load();
let busy = false;
let bubbleTimer;

function fresh() {
  return { trust: 0, roses: 3, worn: Object.fromEntries(ITEMS.map(i => [i.id, true])), last: null, streak: 0 };
}
function load() {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(SAVE_KEY)) }; }
  catch { return fresh(); }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {} }

/* ---------- UI ---------- */
function say(text, ms = 3200) {
  bubble.textContent = text;
  bubble.classList.add('on');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
}

function setMood(m) { svg.dataset.mood = m; }

function play(anim, mood, ms) {
  return new Promise(res => {
    busy = true;
    setMood(mood);
    const cls = 'a-' + anim;
    svg.classList.remove(cls); void svg.getBoundingClientRect(); // restart
    svg.classList.add(cls);
    setTimeout(() => {
      svg.classList.remove(cls);
      setMood(state.trust >= 50 ? 'smile' : 'neutral');
      busy = false; render(); res();
    }, ms);
  });
}

function render() {
  $('#trust-fill').style.width = state.trust + '%';
  $('#trust-num').textContent = Math.round(state.trust);

  // actions
  const a = $('#actions');
  a.innerHTML = '';
  ACTIONS.forEach(act => {
    const b = document.createElement('button');
    const left = act.limited ? ` (${state.roses} left)` : '';
    b.innerHTML = `${act.label}<small>${act.sub}${left}</small>`;
    b.disabled = busy || (act.limited && state.roses <= 0);
    b.onclick = () => doAction(act);
    a.appendChild(b);
  });

  // wardrobe + svg layers
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
    b.innerHTML = `${it.icon} ${it.name}<small>${worn ? (ready ? 'Ready to ask' : `Needs ${it.need} trust`) : 'Off — tap to put back on'}</small>`;
    b.disabled = busy;
    b.onclick = () => toggle(it.id);
    w.appendChild(b);
  });
}

/* ---------- gameplay ---------- */
async function doAction(act) {
  if (busy) return;
  if (act.limited) { if (state.roses <= 0) return; state.roses--; }

  // repeating the same thing is less charming
  state.streak = state.last === act.id ? state.streak + 1 : 0;
  state.last = act.id;
  const gain = act.gain * Math.max(0.25, 1 - state.streak * 0.3);
  const before = state.trust;
  state.trust = Math.min(100, state.trust + gain);
  save();
  say(pick(act.lines));
  await play(act.anim, act.mood, act.ms);

  ITEMS.filter(i => state.worn[i.id] && before < i.need && state.trust >= i.need)
       .forEach(i => say(`💗 Rose is now comfortable removing her ${i.name.toLowerCase()}.`, 3600));
}

async function toggle(id) {
  if (busy) return;
  const it = ITEMS.find(i => i.id === id);
  const layer = $('#c-' + id);

  // put back on — always allowed
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
  say(pick(CONSENT));
  layer.classList.add('removing');
  setTimeout(() => {
    layer.classList.remove('removing');
    layer.classList.add('hidden');
    busy = false;
    setMood('smile');
    render();
    if (ITEMS.every(i => !state.worn[i.id])) say(DONE_LINE, 5000);
  }, 950);
  render();
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
  setMood('neutral'); render(); say('Hi! I\'m Rose. Nice to meet you!');
};

function start() {
  setMood(state.trust >= 50 ? 'smile' : 'neutral');
  render();
  say(state.trust ? 'Welcome back! 🌹' : 'Hi! I\'m Rose. Nice to meet you!');
}

try { if (sessionStorage.getItem('goonrose-18')) { $('#age-gate').hidden = true; $('#game').hidden = false; start(); } } catch {}
