// "Identify the MS2 peptide" — a random peptide's b/y fragment ions form the observed
// spectrum; the player picks which of two candidate sequences explains it. Clicking a
// candidate overlays ITS predicted b/y ions so the match (or mismatch) is visible.
//
// Pure, testable core: ionSeries / observedMz / matchIons (no DOM, no randomness).

const TEAL = '#00979D', ORANGE = '#E86A1C', DARK = '#0A3D52', SLATE = '#5b6b73', GREY = '#9aa6ac';

// Monoisotopic residue masses (Da). Alphabet chosen to avoid near-isobaric confusions
// (no I/K/Q); L stands in for Leu/Ile.
const RES = {
  G:57.02146, A:71.03711, S:87.03203, P:97.05276, V:99.06841, T:101.04768,
  L:113.08406, N:114.04293, D:115.02694, E:129.04259, F:147.06841, R:156.10111,
  Y:163.06333, W:186.07931,
};
const ALPHABET = Object.keys(RES);
const PROTON = 1.007276, WATER = 18.010565;
const r3 = (x) => Math.round(x * 1000) / 1000;

// b-ions (N-terminal, b1..b_{n-1}) and y-ions (C-terminal, y1..y_{n-1}), singly charged.
export function ionSeries(peptide) {
  const m = peptide.split('').map((c) => RES[c]);
  const n = m.length;
  const b = [], y = [];
  let acc = 0;
  for (let i = 0; i < n - 1; i++) { acc += m[i]; b.push({ ion: `b${i + 1}`, mz: r3(acc + PROTON) }); }
  acc = 0;
  for (let j = 0; j < n - 1; j++) { acc += m[n - 1 - j]; y.push({ ion: `y${j + 1}`, mz: r3(acc + WATER + PROTON) }); }
  return { b, y };
}

export function allIons(peptide) {
  const { b, y } = ionSeries(peptide);
  return [...b, ...y];
}

// The observed spectrum m/z list = the target peptide's b/y ions (clean, sorted).
export function observedMz(peptide) {
  return [...new Set(allIons(peptide).map((i) => i.mz))].sort((a, b) => a - b);
}

// How well does `peptide` explain `observedList`? Returns matched count, total predicted,
// and per-ion marks (hit = a peak exists within tol).
export function matchIons(observedList, peptide, tol = 0.3) {
  const marks = allIons(peptide).map((p) => ({
    ion: p.ion, mz: p.mz, hit: observedList.some((o) => Math.abs(o - p.mz) <= tol),
  }));
  return { matched: marks.filter((m) => m.hit).length, total: marks.length, marks };
}

function randPeptide(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// Build one puzzle: a target and a clearly-different decoy of the same length.
export function makePuzzle(len) {
  const target = randPeptide(len);
  let decoy = randPeptide(len), guard = 0;
  const obs = observedMz(target);
  // keep decoys that are different AND explain fewer than half the peaks
  while ((decoy === target || matchIons(obs, decoy).matched > Math.floor((len - 1)))
         && guard++ < 40) decoy = randPeptide(len);
  return { target, decoy, observed: obs, len };
}

// ---------- spectrum drawing (pure, previewable) ----------

const stableHeight = (mz) => 0.55 + 0.4 * ((Math.sin(mz * 12.9898) + 1) / 2); // stable per peak

// Draw the observed spectrum; if `picked` (a peptide) is given, overlay its b/y matches
// (coloured, labelled) and its predicted-but-absent ions (grey ticks at the baseline).
export function buildSpectrumSvg(observed, picked = null) {
  const W = 620, H = 210, x0 = 44, x1 = W - 16, base = H - 34, top = 22;
  const lo = observed[0] - 30, hi = observed[observed.length - 1] + 30;
  const X = (mz) => x0 + (x1 - x0) * (mz - lo) / (hi - lo);
  const marks = picked ? matchIons(observed, picked).marks : [];
  const hitFor = (mz) => {
    const mk = marks.find((m) => m.hit && Math.abs(m.mz - mz) <= 0.3);
    return mk ? { label: mk.ion, color: mk.ion[0] === 'b' ? TEAL : ORANGE } : null;
  };
  let s = '';
  for (const mz of observed) {
    const y1 = base - stableHeight(mz) * (base - top);
    const h = hitFor(mz);
    s += `<line x1="${X(mz)}" y1="${base}" x2="${X(mz)}" y2="${y1}" stroke="${h ? h.color : SLATE}" stroke-width="${h ? 3 : 2}" stroke-linecap="round"/>`;
    if (h) s += `<text x="${X(mz)}" y="${y1 - 5}" text-anchor="middle" font-size="11" font-weight="700" fill="${h.color}" font-family="system-ui,Arial">${h.label}</text>`;
  }
  if (picked) for (const mk of marks) if (!mk.hit)
    s += `<polygon points="${X(mk.mz)},${base + 2} ${X(mk.mz) - 4},${base + 10} ${X(mk.mz) + 4},${base + 10}" fill="${GREY}"/>`;
  s += `<line x1="${x0}" y1="${base}" x2="${x1}" y2="${base}" stroke="#c7d3d6" stroke-width="1"/>`;
  s += `<text x="${(x0 + x1) / 2}" y="${base + 24}" text-anchor="middle" font-size="12" fill="${DARK}" font-family="system-ui,Arial">m/z</text>`;
  s += `<text x="${x0}" y="${base + 24}" text-anchor="start" font-size="10" fill="#7a8890" font-family="system-ui,Arial">${Math.round(lo)}</text>`;
  s += `<text x="${x1}" y="${base + 24}" text-anchor="end" font-size="10" fill="#7a8890" font-family="system-ui,Arial">${Math.round(hi)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ---------- render ----------

export function render(container, { onDone }) {
  let strikes = 0, generated = 0, puzzle = null, order = [], picked = null, answered = false;

  const spectrumSvg = () => buildSpectrumSvg(puzzle.observed, picked);

  function verdictBar() {
    if (!picked) return '';
    const m = matchIons(puzzle.observed, picked);
    const ok = picked === puzzle.target;
    const cls = ok ? 'ok' : 'no';
    const head = ok ? '✓ Correct' : (strikes >= 3 ? '✗ Out of tries' : `✗ Not this one — strike ${strikes}/3`);
    let msg = `<b>${picked}</b> explains <b>${m.matched}/${m.total}</b> peaks. `;
    msg += ok
      ? 'Every b/y ion lines up — this sequence produced the spectrum.'
      : `The real peptide was <b>${puzzle.target}</b> (matches ${matchIons(puzzle.observed, puzzle.target).matched}/${matchIons(puzzle.observed, puzzle.target).total}). Grey ticks = ions this peptide predicts but the spectrum lacks.`;
    return `<div class="feedback ${cls}" style="margin-top:10px"><span>${head}. ${msg}</span></div>`;
  }

  function draw() {
    const dots = [0, 1, 2].map((i) => `<span class="sdot ${i < strikes ? 'miss' : ''}"></span>`).join('');
    const cands = order.map((seq) =>
      `<button class="choice cand" data-seq="${seq}" ${answered ? 'disabled' : ''}>${seq}</button>`).join('');
    const nextLabel = (answered && picked !== puzzle.target && strikes < 3) ? 'Try another spectrum ➔' : '🔄 New spectrum';
    container.innerHTML = `
      <div class="card">
        <span class="chip">Peptide ID (MS2)</span>
        <h2>Which peptide produced this MS2 spectrum?</h2>
        <div class="spectrum">${spectrumSvg()}</div>
        <p class="muted">Click a candidate to overlay its b/y ions. Miss 3 to lose.  <span class="strikes">${dots}</span></p>
        <div class="choices two">${cands}</div>
        ${verdictBar()}
        <button id="newSpec" class="btn-ghost" style="margin-top:8px">${nextLabel}</button>
      </div>`;
    container.querySelectorAll('.cand').forEach((b) => b.onclick = () => pick(b.dataset.seq));
    const ns = container.querySelector('#newSpec');
    if (ns) ns.onclick = () => { newPuzzle(); };
  }

  function pick(seq) {
    if (answered) return;
    answered = true; picked = seq;
    const correct = seq === puzzle.target;
    if (correct) { draw(); return onDone({ correct: true, penalty: false, topic: 'identification', explain: `${puzzle.target}'s b/y ions explain the spectrum — you identified it.` }); }
    strikes += 1;
    draw();
    if (strikes >= 3) onDone({ correct: false, penalty: false, topic: 'identification', explain: `The spectrum was ${puzzle.target}. A peptide is identified when its b/y fragments explain the peaks.` });
  }

  function newPuzzle() {
    if (answered && picked === puzzle?.target) return; // round already won/over
    if (strikes >= 3) return;                            // round already lost
    generated += 1;
    const len = Math.min(4 + generated, 7);              // 5 → 6 → 7 (caps)
    puzzle = makePuzzle(len);
    order = Math.random() < 0.5 ? [puzzle.target, puzzle.decoy] : [puzzle.decoy, puzzle.target];
    picked = null; answered = false;
    draw();
  }

  newPuzzle();
}
