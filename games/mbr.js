export function mbrData() {
  // Run1 P1,P2,P3. Run2 has P1',P2' (true matches) + a decoy at P2's m/z but wrong RT.
  const run1 = [{ id:'P1', mz:650.3 }, { id:'P2', mz:742.9 }, { id:'P3', mz:588.4 }];
  const run2 = [
    { id:'r1', mz:650.3, match:'P1' },
    { id:'r2', mz:742.9, match:'P2' },
    { id:'d',  mz:742.8, match:null },   // decoy: same-ish m/z as P2, wrong RT
  ];
  return { run1, run2, decoyId:'d' };
}

export function evaluateMbr(assignments, data = mbrData()) {
  let penalty = false, allTrue = true;
  for (const r of data.run2) {
    const got = assignments[r.id] ?? null;
    if (r.id === data.decoyId && got !== null) penalty = true;
    if (r.match !== null && got !== r.match) allTrue = false;
    if (r.match === null && got !== null) allTrue = false;
  }
  return { correct: allTrue && !penalty, penalty };
}

export function render(container, { onDone }) {
  const d = mbrData();
  const assignments = {}; // run2Id -> run1Id | null
  container.innerHTML = `
    <div class="card">
      <span class="chip">Match between runs</span>
      <h2>Drag each Run-2 dot onto its Run-1 match. RT drifted ~+1 min.</h2>
      <div class="mbr">
        <div class="lane" id="run1"><b>Run 1</b>
          ${d.run1.map(p=>`<span class="slot" data-p="${p.id}">${p.id}<br><small>${p.mz}</small></span>`).join('')}
        </div>
        <div class="lane" id="run2"><b>Run 2 (drag these)</b>
          ${d.run2.map(r=>`<span class="dot" draggable="true" data-r="${r.id}">?<br><small>${r.mz}</small></span>`).join('')}
        </div>
      </div>
      <p class="muted">Leave a dot unmatched if nothing fits. One is a trap (same mass, wrong RT).</p>
      <button id="mbrDone" class="btn-primary">Submit matches</button>
    </div>`;
  let dragged = null;
  container.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('dragstart', () => { dragged = dot.dataset.r; });
  });
  container.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', () => {
      if (!dragged) return;
      assignments[dragged] = slot.dataset.p;
      slot.classList.add('filled'); slot.dataset.got = dragged;
      const dot = container.querySelector(`.dot[data-r="${dragged}"]`);
      if (dot) dot.classList.add('used');
      dragged = null;
    });
  });
  container.querySelector('#mbrDone').onclick = () => {
    for (const r of d.run2) if (!(r.id in assignments)) assignments[r.id] = null;
    const { correct, penalty } = evaluateMbr(assignments, d);
    onDone({ correct, penalty, topic:'mbr',
      explain: 'P1↔P1 and P2↔P2 match (consistent ~+1 min drift). The decoy has P2\'s mass but wrong RT — a false transfer.' });
  };
}
