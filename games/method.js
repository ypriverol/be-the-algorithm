import { openSvg, closeSvg, bar, label } from './svg.js';

const CASES = [
  { answer:'TMT',   prompt:'One run; each sample gets a tag; quantity read from reporter ions in MS2.' },
  { answer:'LFQ',   prompt:'Separate runs; no labels; quantity from the MS1 precursor across runs.' },
  { answer:'SILAC', prompt:'Light/heavy versions of the same peptide in ONE spectrum; ratio from MS1.' },
  { answer:'DIA',   prompt:'Separate runs; wide isolation windows; quantity from fragment ions.' },
];
const ALL = ['LFQ','SILAC','TMT','DIA'];

export function methodData(seed = Math.floor(Math.random()*CASES.length)) {
  const c = CASES[seed % CASES.length];
  return { answer:c.answer, prompt:c.prompt, choices:ALL };
}
export function checkMethod(choice, data) { return { correct: choice === data.answer }; }

export function render(container, { onDone }) {
  const d = methodData();
  // simple schematic: bars whose colours hint mixing (decorative)
  const bars = [0,1,2].map(i => bar(60+i*40, 60, 26, 80, { color:['#00979D','#E86A1C','#7A5195'][i] })).join('');
  container.innerHTML = `
    <div class="card">
      <span class="chip">Quant methods</span>
      <h2>Which quantification method is this?</h2>
      ${openSvg(300,170)}${bars}${label(150,160,'samples → run(s)',{size:12})}${closeSvg()}
      <p>${d.prompt}</p>
      <div class="choices">${d.choices.map(c=>`<button class="choice mc" data-c="${c}">${c}</button>`).join('')}</div>
    </div>`;
  container.querySelectorAll('.mc').forEach(b => b.onclick = () => {
    const { correct } = checkMethod(b.dataset.c, d);
    onDone({ correct, penalty:false, topic:'methods',
      explain: `This describes ${d.answer}.` });
  });
}
