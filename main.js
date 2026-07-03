import { trainingCards, TOPICS, mcqPool } from './content.js';
import { getName, setName, getBest } from './storage.js';
import { computeDelta, blankPerTopic, recordTopic } from './score.js';

const app = document.getElementById('app');
const mount = (html) => { app.innerHTML = html; };
const $ = (sel) => app.querySelector(sel);
const shuffle = (a) => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const ROUND_TIME = 20; // seconds per MCQ

export const state = {
  name: getName(), screen: 'welcome',
  rounds: [], roundIndex: 0, score: 0, streak: 0, perTopic: {},
};

function go(screen) { state.screen = screen; render(); }

function showWelcome() {
  const best = getBest();
  mount(`
    <div class="card center">
      <h1>Be the Algorithm</h1>
      <p>Learn how software turns mass-spec signal into a quantitative matrix — then play.</p>
      <input id="name" class="name" placeholder="Your name" value="${state.name || ''}" maxlength="24" />
      ${best ? `<p class="muted">Your best: ${best}</p>` : ''}
      <button id="start" class="btn-primary">Start training ➔</button>
    </div>`);
  $('#start').onclick = () => {
    const v = $('#name').value.trim();
    if (!v) { $('#name').focus(); return; }
    state.name = v; setName(v); go('training');
  };
}

let cardIdx = 0;
function showTraining() {
  const c = trainingCards[cardIdx];
  const dots = trainingCards.map((_, i) => `<span class="dot ${i===cardIdx?'on':''}"></span>`).join('');
  mount(`
    <div class="hud"><span>Training</span><a id="skip" class="link">Skip to game ➔</a></div>
    <div class="card center flip" id="flip">
      <span class="chip">${TOPICS[c.topic].label}</span>
      <h2 id="face">${c.front}</h2>
      <p class="muted">tap the card to reveal</p>
    </div>
    <div class="dots">${dots}</div>
    <div class="center"><button id="next" class="btn-primary">Got it ➔</button></div>`);
  let flipped = false;
  $('#flip').onclick = () => { flipped = !flipped; $('#face').textContent = flipped ? c.back : c.front; };
  $('#skip').onclick = () => go('play');
  $('#next').onclick = () => {
    if (cardIdx < trainingCards.length - 1) { cardIdx++; showTraining(); }
    else go('play');
  };
}

function buildRounds() {
  const mcq = shuffle(mcqPool).slice(0, 10).map((m) => ({ type:'mcq', ...m }));
  return mcq; // Task 15 interleaves game rounds here
}

function startPlay() {
  state.rounds = buildRounds();
  state.roundIndex = 0; state.score = 0; state.streak = 0;
  state.perTopic = blankPerTopic(Object.keys(TOPICS));
  runRound();
}

let timer = null, timeLeft = 0;
function hud() {
  return `<div class="hud">
    <span>Q ${state.roundIndex+1}/${state.rounds.length}</span>
    <span id="clock">⏱ ${timeLeft}s</span>
    <span>Score ${state.score} · 🔥${state.streak}</span></div>`;
}

function runRound() {
  const r = state.rounds[state.roundIndex];
  if (r.type === 'mcq') return renderMcq(r);
  // r.type === 'game' handled in Task 15
}

function renderMcq(r) {
  timeLeft = ROUND_TIME;
  const started = Date.now();
  mount(`${hud()}
    <div class="card">
      <span class="chip">${TOPICS[r.topic].label}</span>
      <h2>${r.q}</h2>
      <div class="choices">${r.choices.map((c,i)=>`<button class="choice" data-i="${i}">${c}</button>`).join('')}</div>
    </div>`);
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft -= 1; const el = $('#clock'); if (el) el.textContent = `⏱ ${Math.max(0,timeLeft)}s`;
    if (timeLeft <= 0) { clearInterval(timer); answerMcq(r, -1, started); }
  }, 1000);
  app.querySelectorAll('.choice').forEach((b) =>
    b.onclick = () => answerMcq(r, Number(b.dataset.i), started));
}

function answerMcq(r, idx, started) {
  clearInterval(timer);
  const correct = idx === r.answer;
  const penalty = r.trap !== undefined && idx === r.trap;
  const timeFrac = Math.max(0, (ROUND_TIME - (Date.now()-started)/1000) / ROUND_TIME);
  // mark chosen + correct
  app.querySelectorAll('.choice').forEach((b) => {
    const i = Number(b.dataset.i);
    if (i === r.answer) b.classList.add('good');
    else if (i === idx) b.classList.add('bad');
    b.disabled = true;
  });
  finishRound({ correct, penalty, topic:r.topic, explain:r.explain }, timeFrac);
}

function finishRound(result, timeFrac = 0) {
  const delta = computeDelta({ correct:result.correct, penalty:result.penalty, timeFrac, streak:state.streak });
  state.score += delta;
  state.streak = result.correct ? state.streak + 1 : 0;
  recordTopic(state.perTopic, result.topic, result.correct);
  const sign = delta >= 0 ? `+${delta}` : `${delta}`;
  const bar = document.createElement('div');
  bar.className = `feedback ${result.correct ? 'ok' : 'no'}`;
  bar.innerHTML = `<b>${result.correct ? 'Correct' : (result.penalty ? 'Trap!' : 'Not quite')} ${sign}</b>
    <span>${result.explain}</span>
    <button id="next" class="btn-ghost">${state.roundIndex < state.rounds.length-1 ? 'Next ➔' : 'See results ➔'}</button>`;
  app.appendChild(bar);
  $('#next').onclick = nextRound;
}

function nextRound() {
  if (state.roundIndex < state.rounds.length - 1) { state.roundIndex++; runRound(); }
  else go('results');
}

function render() {
  if (state.screen === 'welcome') return showWelcome();
  if (state.screen === 'training') return showTraining();
  if (state.screen === 'play') return startPlay();
  if (state.screen === 'results') return mount('<div class="card center"><p>Results — Task 9.</p></div>');
}

render();
