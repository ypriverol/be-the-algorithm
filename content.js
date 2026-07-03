export const TOPICS = {
  'scan-levels':  { label:'Scan levels',     review:'MS1=survey, MS2=fragments, MS3=cleaner reporters; ID is MS2, quant varies.' },
  'feature':      { label:'Features',        review:'A feature = isotopes × charge × elution; precursor intensity = XIC area.' },
  'acquisition':  { label:'DDA vs DIA',      review:'DDA picks top-N precursors; DIA fragments everything in wide windows.' },
  'methods':      { label:'Quant methods',   review:'LFQ/SILAC read MS1; DIA reads MS2 fragments; TMT reads reporter ions.' },
  'mbr':          { label:'Match btwn runs', review:'MBR transfers IDs via aligned RT+m/z; same mass+wrong RT = false transfer.' },
  'normalization':{ label:'Normalization',   review:'Removes technical shifts in log2; assumes most proteins do not change.' },
  'rollup':       { label:'Protein roll-up', review:'Many peptides → one protein value; shared peptides → protein groups.' },
  'missing':      { label:'Missing values',  review:'MNAR (low) vs MCAR (random); constant-low imputation fakes on/off hits.' },
  'identification':{ label:'Peptide ID (MS2)', review:'A peptide is identified when its b/y fragment ions explain the MS2 spectrum.' },
};

export const trainingCards = [
  { id:'c1', topic:'scan-levels', front:'What is an MS1 scan?', back:'A survey of the whole, intact peptides (precursors) — gives m/z + intensity.' },
  { id:'c2', topic:'scan-levels', front:'Where does peptide IDENTITY come from?', back:'MS2 fragments (b/y ions) — MS1 alone gives only mass+charge.' },
  { id:'c3', topic:'feature', front:'What is "precursor intensity"?', back:'The integrated AREA of a peptide feature over its elution — not one scan.' },
  { id:'c4', topic:'feature', front:'Why does one peptide make several peaks?', back:'Carbon-13 isotopes → an envelope; the monoisotopic (lightest) peak is the reference.' },
  { id:'c5', topic:'acquisition', front:'DDA vs DIA in one line?', back:'DDA fragments the top-N precursors; DIA fragments EVERYTHING in wide m/z windows.' },
  { id:'c6', topic:'methods', front:'Where is TMT quantity read?', back:'Reporter ions in MS2 (or MS3) — one reporter per sample.' },
  { id:'c7', topic:'mbr', front:'What is match-between-runs?', back:'Transferring an MS2-derived ID to a run lacking its own MS2, via aligned RT + accurate m/z.' },
  { id:'c8', topic:'normalization', front:'What assumption does normalization make?', back:'That MOST proteins do not change — false for IP/secretome/huge perturbations.' },
  { id:'c9', topic:'rollup', front:'Why "protein groups"?', back:"Peptides shared by several proteins can't tell them apart → reported as one group." },
  { id:'c10', topic:'missing', front:'Why is imputation dangerous?', back:'Filling every gap with a low constant makes on/off proteins look hugely (falsely) significant.' },
];

export const mcqPool = [
  { id:'q1', topic:'scan-levels', q:'Peptide sequence identity is read from…', choices:['MS1 precursor','MS2 fragments','The LC column','Reporter ions'], answer:1, trap:0, explain:'Sequence comes from MS2 fragments; MS1 gives only mass+charge.' },
  { id:'q2', topic:'scan-levels', q:'TMT reporter-ion quantity can be read at…', choices:['MS1 only','MS2 or MS3','The LC column','MS1 or MS2'], answer:1, explain:'Reporter ions appear in MS2, or MS3 with SPS-MS3 for cleaner ratios.' },
  { id:'q3', topic:'feature', q:'The precursor intensity of a peptide is…', choices:['The tallest single peak','The area under its elution (XIC)','The number of scans','The charge state'], answer:1, trap:0, explain:'It is the integrated XIC area, not one peak height.' },
  { id:'q4', topic:'feature', q:'Peak spacing of 0.5 m/z in an isotope envelope means charge…', choices:['1+','2+','3+','4+'], answer:1, explain:'Spacing = 1/z, so 0.5 → z = 2.' },
  { id:'q5', topic:'acquisition', q:'DIA differs from DDA because it…', choices:['Skips MS2','Fragments everything in wide windows','Has no MS1','Only works for TMT'], answer:1, explain:'DIA co-fragments many precursors in wide windows; quant uses fragments.' },
  { id:'q6', topic:'methods', q:'Label-free (LFQ) reads quantity from…', choices:['MS2 reporter ions','MS1 precursor intensity','MS3','The database'], answer:1, explain:'LFQ quantifies the MS1 precursor feature across runs.' },
  { id:'q7', topic:'methods', q:'Which method gives the FEWEST missing values within one run?', choices:['LFQ','DIA','TMT (isobaric)','SILAC'], answer:2, explain:'TMT multiplexes samples in one run → few missing values within a plex.' },
  { id:'q8', topic:'mbr', q:"A Run-2 signal has P2's m/z but RT off by +3.5 min (drift is ~+1). You should…", choices:["Transfer P2's ID",'Not transfer — likely a different peptide','Delete P2','Always trust same m/z'], answer:1, trap:0, explain:'Same mass + wrong RT = a false transfer; MBR needs consistent RT.' },
  { id:'q9', topic:'normalization', q:'Global normalization can LIE when…', choices:['Samples are identical','Most proteins really change (e.g. IP)','You use log2','You have replicates'], answer:1, explain:'It assumes most proteins are unchanged; IP/secretome break that.' },
  { id:'q10', topic:'rollup', q:'A row in a protein table is best described as…', choices:['Exactly one gene','A protein GROUP of indistinguishable proteins','A single peptide','A raw scan'], answer:1, trap:0, explain:'Shared peptides force indistinguishable proteins into one group.' },
  { id:'q11', topic:'missing', q:'Missing-not-at-random (MNAR) values are usually…', choices:['Random dropouts','Genuinely low / below detection','Duplicates','Calibration errors'], answer:1, explain:'MNAR gaps track abundance — the peptide is truly low.' },
  { id:'q12', topic:'missing', q:'Filling all gaps with the same low value tends to…', choices:['Fix everything','Manufacture fake on/off hits','Remove batch effects','Improve identity'], answer:1, trap:0, explain:'Constant-low imputation invents huge fold-changes.' },
  { id:'q13', topic:'feature', q:'One peptide can appear as several features because of…', choices:['Different charge states','Different databases','Different lab','Different colour'], answer:0, explain:'The same peptide shows up at 2+, 3+ … (and isotopes).' },
  { id:'q14', topic:'scan-levels', q:'In DDA, after an MS1 survey the instrument…', choices:['Fragments all ions','Picks a subset (top-N) to fragment','Stops','Skips MS2'], answer:1, explain:'DDA selects the most intense precursors for MS2.' },
  { id:'q15', topic:'methods', q:'iBAQ divides summed intensity by…', choices:['Sample count','Number of observable tryptic peptides','Charge','Retention time'], answer:1, explain:'Dividing by observable peptides removes the protein-size bias.' },
  { id:'q16', topic:'normalization', q:'We work in log2 mainly because…', choices:['It looks nicer','Intensities span orders of magnitude; ratios become differences','It removes IDs','It adds charge'], answer:1, explain:'Log2 compresses dynamic range and turns fold-changes into differences.' },
  { id:'q17', topic:'acquisition', q:'DIA typically quantifies on…', choices:['MS1 only','Fragment ions','Reporter ions','The FASTA'], answer:1, explain:'Wide windows co-isolate precursors, so fragments give specificity.' },
  { id:'q18', topic:'mbr', q:'The upside of match-between-runs is…', choices:['Fewer missing values','No FDR needed','Faster gradients','More charge'], answer:0, explain:'MBR fills gaps across runs — but needs its own error control.' },
  { id:'q19', topic:'identification', q:'A peptide is identified when…', choices:['its precursor mass alone matches','its b/y fragment ions explain the MS2 spectrum','it elutes first','it carries charge 2+'], answer:1, trap:0, explain:'Sequence is confirmed by matching the b/y fragment ladder in MS2, not mass alone.' },
  { id:'q20', topic:'identification', q:'b and y ions are…', choices:['random noise','fragments from breaking the peptide backbone','reporter ions','carbon isotopes'], answer:1, explain:'Fragmenting the backbone yields N-terminal (b) and C-terminal (y) ions.' },
];

export function validateContent() {
  const errs = [];
  const IDS = Object.keys(TOPICS);
  for (const id of IDS) if (!TOPICS[id].review) errs.push(`topic ${id} missing review`);
  for (const c of trainingCards) {
    if (!IDS.includes(c.topic)) errs.push(`card ${c.id} bad topic ${c.topic}`);
    if (!c.front || !c.back) errs.push(`card ${c.id} missing front/back`);
  }
  for (const q of mcqPool) {
    if (!IDS.includes(q.topic)) errs.push(`mcq ${q.id} bad topic ${q.topic}`);
    if (!Array.isArray(q.choices) || q.choices.length < 2) errs.push(`mcq ${q.id} needs >=2 choices`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) errs.push(`mcq ${q.id} bad answer index`);
    if (q.trap !== undefined && (q.trap < 0 || q.trap >= q.choices.length)) errs.push(`mcq ${q.id} bad trap index`);
    if (!q.explain) errs.push(`mcq ${q.id} missing explain`);
  }
  return errs;
}
