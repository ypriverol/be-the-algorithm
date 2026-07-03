import { openSvg, closeSvg, stem, label } from './svg.js';

export function envelopeData() {
  // 2+ ion, spacing 0.5; heights decreasing; monoisotopic = leftmost
  const base = 600.0, dm = 0.5;
  const heights = [1, 0.62, 0.27, 0.09];
  const peaks = heights.map((h, i) => ({ mz: +(base + i*dm).toFixed(1), h }));
  return { peaks, monoIndex: 0, charge: 2 };
}

export function checkEnvelope(clickIndex, chargeChoice, data) {
  return { correct: clickIndex === data.monoIndex && Number(chargeChoice) === data.charge };
}

// Build a specific, teaching explanation from what the player got right/wrong.
export function explainEnvelope(picked, charge, data) {
  const monoMz = data.peaks[data.monoIndex].mz;
  const spacing = +(data.peaks[1].mz - data.peaks[0].mz).toFixed(2);
  const okPeak = picked === data.monoIndex;
  const okCharge = Number(charge) === data.charge;
  if (okPeak && okCharge)
    return `Correct! The left-most peak (m/z ${monoMz}) is monoisotopic — every atom is its light isotope. `
         + `The peaks are ${spacing} apart, and spacing = 1/z, so z = ${data.charge} (${data.charge}+).`;
  const parts = [];
  if (!okPeak) {
    const pm = data.peaks[picked]?.mz;
    parts.push(`Monoisotopic = the LEFT-most peak (lowest m/z ${monoMz}), the all-light-isotope one. `
      + `You clicked m/z ${pm}, which is M+${picked} — it carries ${picked} carbon-13${picked > 1 ? 's' : ''}.`);
  }
  if (!okCharge) {
    parts.push(`Charge comes from the spacing: the peaks are ${spacing} m/z apart, and spacing = 1/z, `
      + `so z = 1/${spacing} = ${data.charge} (${data.charge}+)${charge ? `, not ${charge}+` : ''}.`);
  }
  return parts.join(' ');
}

export function render(container, { onDone }) {
  const d = envelopeData();
  const W = 520, H = 275, x0 = 60, y0 = 220, colW = 100;
  let picked = null, charge = null, revealed = false;

  const draw = () => {
    const stems = d.peaks.map((p, i) => {
      const x = x0 + i * colW, y1 = y0 - p.h * 150;
      let color = picked === i ? '#E86A1C' : '#00979D';
      if (revealed && i === d.monoIndex) color = '#2E7D32';              // true mono → green on reveal
      let extra = label(x, y0 + 22, `${p.mz}`, { size: 12 });
      if (revealed && i === d.monoIndex)
        extra += label(x, y1 - 8, 'monoisotopic', { size: 11, color: '#2E7D32' });
      if (revealed && picked !== d.monoIndex && i === picked)
        extra += label(x, y1 - 8, 'your pick', { size: 11, color: '#C0392B' });
      return stem(x, y0, y1, { color, w: 16, id: `pk${i}` }) + extra;
    }).join('');
    // spacing annotation (revealed): arrow between the first two peaks
    let anno = '';
    if (revealed) {
      const xa = x0, xb = x0 + colW, ya = 44;
      anno = `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${ya}" stroke="#0A3D52" stroke-width="1.5"/>`
        + `<polygon points="${xb},${ya} ${xb-6},${ya-4} ${xb-6},${ya+4}" fill="#0A3D52"/>`
        + `<polygon points="${xa},${ya} ${xa+6},${ya-4} ${xa+6},${ya+4}" fill="#0A3D52"/>`
        + label((xa + xb) / 2, ya - 8, `Δ ${(d.peaks[1].mz - d.peaks[0].mz).toFixed(1)} = 1/z → z = ${d.charge}`, { size: 12, color: '#0A3D52' });
    }
    container.innerHTML = `
      <div class="card">
        <span class="chip">Feature detection</span>
        <h2>Click the monoisotopic peak, then pick the charge</h2>
        ${openSvg(W, H)}${anno}${stems}${closeSvg()}
        <div class="choices">
          ${[1, 2, 3].map(z => `<button class="choice zc ${charge === z ? 'good' : ''}" data-z="${z}" ${revealed ? 'disabled' : ''}>${z}+</button>`).join('')}
        </div>
        ${revealed ? '' : `<button id="submitEnv" class="btn-primary" ${picked !== null && charge !== null ? '' : 'disabled'}>Submit</button>`}
      </div>`;
    if (!revealed) {
      d.peaks.forEach((_, i) => { container.querySelector(`#pk${i}`).onclick = () => { picked = i; draw(); }; });
      container.querySelectorAll('.zc').forEach(b => b.onclick = () => { charge = Number(b.dataset.z); draw(); });
      const sb = container.querySelector('#submitEnv');
      if (sb) sb.onclick = () => {
        const { correct } = checkEnvelope(picked, charge, d);
        revealed = true;
        draw();                                           // reveal the answer on the spectrum
        onDone({ correct, penalty: false, topic: 'feature', explain: explainEnvelope(picked, charge, d) });
      };
    }
  };
  draw();
}
