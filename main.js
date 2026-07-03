import { trainingCards, TOPICS } from './content.js';
import { getName, setName, getBest } from './storage.js';

const app = document.getElementById('app');
const mount = (html) => { app.innerHTML = html; };
const $ = (sel) => app.querySelector(sel);

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

function render() {
  if (state.screen === 'welcome') return showWelcome();
  if (state.screen === 'training') return showTraining();
  if (state.screen === 'play') return mount('<div class="card center"><p>Play screen — Task 7.</p></div>');
  if (state.screen === 'results') return mount('<div class="card center"><p>Results — Task 9.</p></div>');
}

render();
