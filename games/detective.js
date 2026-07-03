export function detectiveData() {
  const rows = [
    { name:'ON-OFF-1', ctrl:['NA','NA','NA'], trt:['22.1','22.3','21.9'], real:false }, // imputed → fake 16x
    { name:'STEADY-2', ctrl:['24.0','24.2','23.9'], trt:['25.1','25.0','25.2'], real:true }, // measured 2x
  ];
  return { rows, trustworthyName:'STEADY-2', artifactName:'ON-OFF-1' };
}

export function checkDetective(pickName, data) {
  return { correct: pickName === data.trustworthyName, penalty: pickName === data.artifactName };
}

export function render(container, { onDone }) {
  const d = detectiveData();
  const head = `<tr><th>Protein</th><th>Ctrl</th><th>Ctrl</th><th>Ctrl</th><th>Trt</th><th>Trt</th><th>Trt</th></tr>`;
  const body = d.rows.map(r =>
    `<tr><td><button class="choice pick" data-n="${r.name}">${r.name}</button></td>
     ${r.ctrl.map(v=>`<td class="${v==='NA'?'na':''}">${v}</td>`).join('')}
     ${r.trt.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');
  container.innerHTML = `
    <div class="card">
      <span class="chip">Missing values</span>
      <h2>Both look "up" in Treated. Which up-regulation do you TRUST?</h2>
      <table class="matrix">${head}${body}</table>
      <p class="muted">NA = missing (was imputed to a low value).</p>
    </div>`;
  container.querySelectorAll('.pick').forEach(b => b.onclick = () => {
    const { correct, penalty } = checkDetective(b.dataset.n, d);
    onDone({ correct, penalty, topic:'missing',
      explain: 'STEADY-2 is measured everywhere (real ~2×). ON-OFF-1\'s "16×" is manufactured by imputing the NA controls.' });
  });
}
