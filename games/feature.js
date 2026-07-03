export function featureData() {
  // Blobs carry DATA coordinates (retention time, m/z). The target sits exactly at the
  // prompted spot (RT 30, m/z 900); the trap is a tempting near-neighbour (interference).
  const blobs = [
    { id:'t',  rt:30, mz:900, r:24, kind:'target' },
    { id:'x',  rt:33, mz:916, r:19, kind:'trap' },   // interference: close in RT & m/z
    { id:'o1', rt:16, mz:760, r:15, kind:'other' },
    { id:'o2', rt:43, mz:840, r:17, kind:'other' },
    { id:'o3', rt:22, mz:662, r:13, kind:'other' },
  ];
  return { blobs, targetId:'t', trapId:'x' };
}

export function checkFeature(clickId, data) {
  return { correct: clickId === data.targetId, penalty: clickId === data.trapId };
}

// Axis-annotated RT × m/z map. Exported so it can be rendered/previewed on its own.
export function featureSvg(data) {
  const W = 560, H = 300, x0 = 52, x1 = W - 14, yTop = 18, yBot = H - 40;
  const RT0 = 10, RT1 = 50, MZ0 = 620, MZ1 = 1000;
  const X = (rt) => x0 + (x1 - x0) * (rt - RT0) / (RT1 - RT0);
  const Y = (mz) => yBot - (yBot - yTop) * (mz - MZ0) / (MZ1 - MZ0);
  let s = '';
  // axes
  s += `<line x1="${x0}" y1="${yTop}" x2="${x0}" y2="${yBot}" stroke="#9aa6ac" stroke-width="1.5"/>`;
  s += `<line x1="${x0}" y1="${yBot}" x2="${x1}" y2="${yBot}" stroke="#9aa6ac" stroke-width="1.5"/>`;
  // x ticks (RT)
  for (let rt = RT0; rt <= RT1; rt += 10) {
    s += `<line x1="${X(rt)}" y1="${yBot}" x2="${X(rt)}" y2="${yBot + 5}" stroke="#9aa6ac" stroke-width="1"/>`;
    s += `<text x="${X(rt)}" y="${yBot + 18}" text-anchor="middle" font-size="11" fill="#7a8890" font-family="system-ui,Arial">${rt}</text>`;
  }
  s += `<text x="${(x0 + x1) / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#0A3D52" font-weight="700" font-family="system-ui,Arial">retention time (s)</text>`;
  // y ticks (m/z)
  for (let mz = 700; mz <= MZ1; mz += 100) {
    s += `<line x1="${x0 - 5}" y1="${Y(mz)}" x2="${x0}" y2="${Y(mz)}" stroke="#9aa6ac" stroke-width="1"/>`;
    s += `<text x="${x0 - 8}" y="${Y(mz) + 4}" text-anchor="end" font-size="11" fill="#7a8890" font-family="system-ui,Arial">${mz}</text>`;
  }
  s += `<text x="${x0 - 40}" y="${yTop - 4}" font-size="12" fill="#0A3D52" font-weight="700" font-family="system-ui,Arial">m/z</text>`;
  // blobs
  for (const b of data.blobs)
    s += `<circle id="bl_${b.id}" cx="${X(b.rt)}" cy="${Y(b.mz)}" r="${b.r}" fill="#00979D" fill-opacity="0.55" style="cursor:pointer"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

export function render(container, { onDone }) {
  const d = featureData();
  container.innerHTML = `
    <div class="card">
      <span class="chip">Feature detection</span>
      <h2>Your peptide is at m/z 900, RT 30 s. Click YOUR feature.</h2>
      <div class="feature-map">${featureSvg(d)}</div>
      <p class="muted">Read the axes to find (30 s, 900) — beware a near-identical neighbour (interference).</p>
    </div>`;
  d.blobs.forEach(b => {
    const el = container.querySelector(`#bl_${b.id}`);
    el.onclick = () => {
      const { correct, penalty } = checkFeature(b.id, d);
      onDone({ correct, penalty, topic:'feature',
        explain: 'The target sits at exactly m/z 900, RT 30 s; the close neighbour is interference.' });
    };
  });
}
