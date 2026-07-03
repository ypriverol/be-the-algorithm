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

// A small schematic per method: how samples combine (left) → where the number is read (right).
// It describes the MECHANISM (mixed/separate, MS1/MS2/reporter) without naming the method,
// so the figure genuinely complements the prompt instead of giving the answer away.
export function schematic(answer) {
  const A='#00979D', B='#E86A1C', C='#7A5195', G='#9AA6AC', D='#0A3D52';
  const box=(x,y,w,h,f,t,tc='#fff',fs=11)=>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${f}"/>`+
    (t?`<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="${fs}" fill="${tc}" font-family="system-ui,Arial">${t}</text>`:'');
  const arw=(x1,y1,x2,y2)=>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#66727a" stroke-width="2"/>`+
    `<polygon points="${x2},${y2} ${x2-7},${y2-4} ${x2-7},${y2+4}" fill="#66727a"/>`;
  const stem=(x,c,top)=>`<line x1="${x}" y1="120" x2="${x}" y2="${top}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  const note=(x,t)=>`<text x="${x}" y="134" text-anchor="middle" font-size="10" fill="#404A4F" font-family="system-ui,Arial">${t}</text>`;
  const cap=(t)=>`<text x="170" y="160" text-anchor="middle" font-size="12" fill="#0A3D52" font-weight="700" font-family="system-ui,Arial">${t}</text>`;
  const S=(y,c,t)=>box(12,y,52,26,c,t);
  let g='';
  if (answer==='TMT') {
    g = S(14,A,'S1')+S(52,B,'S2')+S(90,C,'S3')
      + arw(66,27,148,66)+arw(66,65,148,66)+arw(66,103,148,66)
      + box(148,50,60,44,'#eef3f4','1 run',D)
      + arw(210,72,240,72)
      + stem(256,A,64)+stem(270,B,86)+stem(284,C,72)+stem(298,A,96)
      + note(279,'reporter ions')
      + cap('mixed → 1 run · reporter ions (MS2)');
  } else if (answer==='LFQ') {
    g = S(14,A,'S1')+S(52,B,'S2')+S(90,C,'S3')
      + arw(66,27,148,27)+arw(66,65,148,65)+arw(66,103,148,103)
      + box(148,14,60,26,'#eef3f4','run 1',D)+box(148,52,60,26,'#eef3f4','run 2',D)+box(148,90,60,26,'#eef3f4','run 3',D)
      + arw(210,65,244,65)
      + stem(268,A,52)+note(283,'MS1 peak')
      + cap('separate runs · read MS1 precursor');
  } else if (answer==='SILAC') {
    g = box(12,32,52,26,G,'light')+box(12,84,52,26,D,'heavy')
      + arw(66,45,148,68)+arw(66,97,148,68)
      + box(148,50,60,44,'#eef3f4','1 run',D)
      + arw(210,72,240,72)
      + stem(266,G,66)+stem(280,D,58)
      + note(273,'light + heavy pair')
      + cap('mixed → 1 run · pair in MS1');
  } else { // DIA
    g = S(52,A,'S1')
      + arw(66,65,150,65)
      + box(150,36,84,60,'#eef3f4','',D)
      + `<line x1="150" y1="56" x2="234" y2="56" stroke="#00979D" stroke-width="1"/>`
      + `<line x1="150" y1="76" x2="234" y2="76" stroke="#00979D" stroke-width="1"/>`
      + `<text x="192" y="32" text-anchor="middle" font-size="9" fill="#404A4F" font-family="system-ui,Arial">wide windows</text>`
      + arw(236,66,262,66)
      + stem(276,A,60)+stem(288,A,82)+stem(300,A,68)
      + note(288,'fragments')
      + cap('separate runs · wide windows · MS2 fragments');
  }
  return `<svg viewBox="0 0 340 172" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

export function render(container, { onDone }) {
  const d = methodData();
  container.innerHTML = `
    <div class="card">
      <span class="chip">Quant methods</span>
      <h2>Which quantification method is this?</h2>
      <div class="method-fig">${schematic(d.answer)}</div>
      <p>${d.prompt}</p>
      <div class="choices">${d.choices.map(c=>`<button class="choice mc" data-c="${c}">${c}</button>`).join('')}</div>
    </div>`;
  container.querySelectorAll('.mc').forEach(b => b.onclick = () => {
    const { correct } = checkMethod(b.dataset.c, d);
    onDone({ correct, penalty:false, topic:'methods',
      explain: `This describes ${d.answer}.` });
  });
}
