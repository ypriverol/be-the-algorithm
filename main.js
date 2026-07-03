import { trainingCards, TOPICS, mcqPool } from './content.js';
import { getName, setName, getBest, submitScore, fetchLeaderboard } from './storage.js';
import { blankPerTopic, tierFor, badgeFor } from './score.js';
import { createRound } from './roundengine.js';
import { games, gameIds } from './games/registry.js';

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
      <h1>QuantQuest</h1>
      <p>Learn how software turns mass-spec signal into a quantitative matrix — then play.</p>
      <input id="name" class="name" placeholder="Your name" value="${state.name || ''}" maxlength="24" />
      ${best ? `<p class="muted">Your best: ${best}</p>` : ''}
      <button id="start" class="btn-primary">Start training ➔</button>
      <div id="board"></div>
    </div>`);
  $('#start').onclick = () => {
    const v = $('#name').value.trim();
    if (!v) { $('#name').focus(); return; }
    state.name = v; setName(v); go('training');
  };
  renderBoard(10);
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
  const mcq = shuffle(mcqPool).slice(0, 8).map((m) => ({ type:'mcq', ...m }));
  const gameRounds = shuffle(gameIds).map((id) => ({ type:'game', gameId:id }));
  // interleave: game, then ~2 mcq, repeat
  const rounds = []; let gi = 0, mi = 0;
  while (gi < gameRounds.length || mi < mcq.length) {
    if (gi < gameRounds.length) rounds.push(gameRounds[gi++]);
    for (let k=0;k<2 && mi<mcq.length;k++) rounds.push(mcq[mi++]);
  }
  return rounds;
}

function startPlay() {
  state.rounds = buildRounds();
  state.roundIndex = 0; state.score = 0; state.streak = 0;
  state.perTopic = blankPerTopic(Object.keys(TOPICS));
  runRound();
}

let timer = null, timeLeft = 0, currentRound = null;
function hud() {
  return `<div class="hud">
    <span>Q ${state.roundIndex+1}/${state.rounds.length}</span>
    <span id="clock">${(() => { const r = state.rounds[state.roundIndex]; return r && r.type === 'mcq' ? `⏱ ${timeLeft}s` : '·'; })()}</span>
    <span>Score ${state.score} · 🔥${state.streak}</span></div>`;
}

function runRound() {
  currentRound = createRound();       // new round: completable exactly once
  const r = state.rounds[state.roundIndex];
  if (r.type === 'mcq') return renderMcq(r);
  // game round
  mount(`${hud()}<div id="gameHost"></div>`);
  const host = $('#gameHost');
  games[r.gameId].render(host, { onDone: (result) => finishRound(result, 0) });
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
  const outcome = currentRound.complete(state, result, timeFrac);
  if (!outcome.applied) return;      // one-shot: repeat completion of this round is ignored
  clearInterval(timer);
  // freeze inputs so re-clicking a game/choice can't add a 2nd feedback bar
  app.querySelectorAll('.choice').forEach((b) => { b.disabled = true; });
  const gh = $('#gameHost'); if (gh) gh.style.pointerEvents = 'none';
  const delta = outcome.delta;
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

function maxScore() { return state.rounds.length * 150; } // 100 base + 50 speed, mult ignored for a stable %

function showResults() {
  const pct = Math.round(100 * state.score / Math.max(1, maxScore()));
  const tier = tierFor(pct); const badge = badgeFor(state.perTopic);
  const bars = Object.entries(state.perTopic).filter(([,v])=>v.seen).map(([t,v])=>{
    const a = Math.round(100*v.correct/v.seen);
    return `<div class="trow"><span>${TOPICS[t].label}</span>
      <span class="track"><span class="fill" style="width:${a}%"></span></span><span>${a}%</span></div>`;
  }).join('');
  const review = Object.entries(state.perTopic).filter(([,v])=>v.seen && v.correct/v.seen < 0.6)
    .map(([t])=>`<li>${TOPICS[t].label}: ${TOPICS[t].review}</li>`).join('') || '<li>Nice — nothing flagged to review!</li>';
  mount(`
    <div class="card center">
      <span class="chip">${state.name}</span>
      <h1>${state.score} pts</h1>
      <div class="tier ${tier.cls}">${tier.name}</div>
      <p>Badge: <b>${badge}</b></p>
      <div class="bars">${bars}</div>
      <details><summary>What to review</summary><ul>${review}</ul></details>
      <div class="center" style="gap:10px">
        <button id="again" class="btn-primary">Play again ➔</button>
        <button id="share" class="btn-ghost">Copy my score</button>
      </div>
      <p id="msg" class="muted"></p>
      <div id="board"></div>
    </div>`);
  submitScore({ name:state.name, score:state.score, tier:tier.name, badge });
  $('#again').onclick = () => go('play');
  $('#share').onclick = async () => {
    const txt = `I scored ${state.score} (${tier.name}, ${badge}) on QuantQuest!`;
    try { await navigator.clipboard.writeText(txt); $('#msg').textContent = 'Copied!'; }
    catch { $('#msg').textContent = txt; }
  };
  renderBoard(10);
}

async function renderBoard(top = 10) {
  const el = $('#board');
  if (!el) return;
  el.innerHTML = '<p class="muted">Loading class board…</p>';
  const list = await fetchLeaderboard(top);
  if (list === null) { el.innerHTML = ''; return; }        // board not configured → hide
  if (!list.length) { el.innerHTML = '<p class="muted">Class board is empty — you could be first!</p>'; return; }
  let mine = false;
  const rows = list.map((r, i) => {
    const you = !mine && r.name === state.name && r.score === state.score;
    if (you) mine = true;
    return `<tr class="${you ? 'you' : ''}"><td>${i + 1}</td><td>${esc(r.name)}</td>
      <td>${r.score}</td><td>${esc(r.tier || '')}</td></tr>`;
  }).join('');
  el.innerHTML = `
    <h2 class="board-h">Class board — top scores</h2>
    <table class="board"><tr><th>#</th><th>Name</th><th>Score</th><th>Tier</th></tr>${rows}</table>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function render() {
  if (state.screen === 'welcome') return showWelcome();
  if (state.screen === 'training') return showTraining();
  if (state.screen === 'play') return startPlay();
  if (state.screen === 'results') return showResults();
}

render();
