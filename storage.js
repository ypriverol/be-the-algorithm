const LS = () => globalThis.localStorage || null;
const K_NAME = 'bta.name', K_BEST = 'bta.best';

export const getName = () => LS()?.getItem(K_NAME) || '';
export const setName = (s) => LS()?.setItem(K_NAME, s);
export const getBest = () => Number(LS()?.getItem(K_BEST) || 0);
export const setBest = (n) => { if (n > getBest()) LS()?.setItem(K_BEST, n); };

// Leaderboard seam: today writes locally. Later, swap the body to POST to a backend.
export function submitScore({ name, score, tier, perTopic }) {
  setBest(score);
  return { ok: true, mode: 'local' };
}
