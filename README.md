# QuantQuest

Interactive quiz + game for computational proteomics quantification. Static, no build.

## Play locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Run logic tests
```bash
node --test
```

## Deploy
Push to `main` on `ypriverol/quantquest` and enable GitHub Pages (root). Static — no Action needed.

## How to extend
- **Add a question/card:** edit `content.js` (`mcqPool` / `trainingCards`). Run `node --test` — the validator checks it.
- **Add a mini-game:** create `games/<id>.js` exporting `render(container,{onDone})`; register it in `games/registry.js`; add its `topic` mapping in `buildRounds()` (main.js).
- **Shared class leaderboard:** paste your Google Apps Script Web App URL into `config.js` (`LEADERBOARD_URL`). Full 5-minute setup in [docs/leaderboard.md](docs/leaderboard.md). Leave it `''` for local-only scores.

## Manual QA checklist
- [ ] Welcome requires a name; Start advances to Training.
- [ ] Training cards flip on tap; dots track; "Skip to game" works.
- [ ] MCQs: timer counts down and auto-answers at 0; correct=green, wrong=red; trap shows "Trap! -50".
- [ ] All 5 mini-games render, are solvable, and their traps apply a penalty.
- [ ] Score, streak (🔥), and per-topic bars update correctly.
- [ ] Results shows tier colour by %, a badge, review list, Play again, Copy score.
- [ ] Works at a narrow (phone) width — choices stack, SVGs scale.
