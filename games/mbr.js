export function mbrData() {
  // Run 2's RT drifted ~+1 min vs Run 1. Each run2 dot carries m/z AND retention time.
  // The decoy shares P2's EXACT m/z (742.9) — so m/z alone cannot reject it; only its
  // inconsistent RT (+3.5 min vs the ~+1 min drift) reveals it as a different peptide.
  const run1 = [
    { id:'P1', mz:650.3, rt:22.0 },
    { id:'P2', mz:742.9, rt:31.5 },
    { id:'P3', mz:588.4, rt:40.2 },
  ];
  const run2 = [
    { id:'r1', mz:650.3, rt:23.1, match:'P1' },  // +1.1 min — consistent drift
    { id:'r2', mz:742.9, rt:32.4, match:'P2' },  // +0.9 min — consistent drift
    { id:'d',  mz:742.9, rt:35.0, match:null },  // decoy: SAME m/z as P2, RT +3.5 → wrong peptide
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
  const kv = (mz, rt) => `<span class="kv">m/z<em>${mz}</em></span><span class="kv">RT<em>${rt.toFixed(1)}</em></span>`;
  container.innerHTML = `
    <div class="card">
      <span class="chip">Match between runs</span>
      <h2>Match each Run 2 signal to Run 1</h2>
      <p class="muted">Run 2's RT drifted ~+1 min. Two Run 2 dots share m/z 742.9 — only RT tells them apart. Drag each dot to its match; leave the wrong-RT impostor unmatched.</p>
      <div class="mbr">
        <div class="lane"><span class="lane-h">Run 1 — targets</span>
          ${d.run1.map(p=>`<span class="mbr-slot" data-p="${p.id}"><b>${p.id}</b>${kv(p.mz,p.rt)}</span>`).join('')}
        </div>
        <div class="lane"><span class="lane-h">Run 2 — drag these</span>
          ${d.run2.map(r=>`<span class="mbr-dot" draggable="true" data-r="${r.id}"><b>?</b>${kv(r.mz,r.rt)}</span>`).join('')}
        </div>
      </div>
      <button id="mbrDone" class="btn-primary">Submit matches</button>
    </div>`;
  let dragged = null;
  container.querySelectorAll('.mbr-dot').forEach(dot => {
    dot.addEventListener('dragstart', () => { dragged = dot.dataset.r; });
  });
  container.querySelectorAll('.mbr-slot').forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', () => {
      if (!dragged) return;
      assignments[dragged] = slot.dataset.p;
      slot.classList.add('filled'); slot.dataset.got = dragged;
      const dot = container.querySelector(`.mbr-dot[data-r="${dragged}"]`);
      if (dot) dot.classList.add('used');
      dragged = null;
    });
  });
  container.querySelector('#mbrDone').onclick = () => {
    for (const r of d.run2) if (!(r.id in assignments)) assignments[r.id] = null;
    const { correct, penalty } = evaluateMbr(assignments, d);
    onDone({ correct, penalty, topic:'mbr',
      explain: 'P1 and P2 match with a consistent ~+1 min RT drift (22.0→23.1, 31.5→32.4). The decoy shares P2\'s exact m/z (742.9) but its RT is 35.0 (+3.5 min) — inconsistent, so it\'s a different peptide. Same mass is not enough; RT rejects the false transfer.' });
  };
}
