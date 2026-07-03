# Be the Algorithm — Design Spec

**Date:** 2026-07-03
**Repo (target):** `ypriverol/be-the-algorithm` (GitHub Pages)
**One-liner:** A static, client-side quiz + game that teaches computational proteomics quantification concepts to students, drawing on the EMBL-EBI course lectures (Yasset Perez-Riverol's "Computational basics of peptide/protein quantification" and Kathryn Lilley's "Introduction to quantitative proteomics techniques").

---

## 1. Goals & non-goals

**Goals**
- Reinforce the lecture concepts through active recall (quiz) and hands-on interaction (mini-games).
- Work as **self-study** on any device (laptop/phone), no login, no backend.
- Be **fun**: streaks, timer, score, tiers, badges; judgment traps that penalise the common mistakes.
- Be **easy to host and extend**: zero build step; questions and cards live in editable data files.
- Leave a clean **seam** to add a shared leaderboard later without a rewrite.

**Non-goals (v1)**
- No backend, accounts, or persistence beyond `localStorage`.
- No shared/live leaderboard yet (only a `submitScore()` stub).
- Not a full LMS; not graded/authoritative — it's a learning aid.
- No teaching of statistics/tool-specifics beyond what the two lectures cover.

**Success criteria**
- A student can enter a name, learn ~8 concepts, play ~12–15 scored rounds (MCQ + 5 mini-games), and get a final score + tier + per-topic breakdown, all in a browser opened from GitHub Pages, in ~12–15 minutes.

---

## 2. Player flow (state machine)

Four screens, driven by one state machine in `main.js`:

1. **Welcome** — title, one-line pitch, **name input**, Start button. Name persisted to `localStorage` (`bta.playerName`). If a previous best score exists, show it.
2. **Training** — 6–8 **tap-to-reveal concept cards** (front = question/prompt, back = plain-language answer + a small SVG where useful). No scoring. Progress dots; "Got it →" advances. A "Skip to game" link.
3. **Play (scored)** — a shuffled sequence of ~12–15 **rounds**. Each round is either an **MCQ** or a **mini-game**. Persistent HUD: `round x/N`, countdown timer, running score, streak flame. Immediate feedback per round (correct/incorrect + one-line explanation), then Next.
4. **Results** — final score; **tier** (Gold/Silver/Bronze by %); a **badge**; **per-topic accuracy** bars; "what to review" (topic → one-line pointer); **Replay** (reshuffles); **Share/Submit score** button (v1: copies a result string + stores best locally; the future leaderboard hook).

Back/refresh mid-game resets to Welcome (state is in memory; name persists). This is acceptable for a short self-study session.

---

## 3. Content model (data-driven)

All learning content is **data**, not code, so it can be edited without touching the engine. Two collections in `content.js` (plain JS objects/arrays):

### 3.1 Training cards
```js
{ id, topic, front, back, svg? }   // svg = optional key of a small illustrative SVG
```
~8 cards, one per core concept (see topics list §3.3).

### 3.2 MCQ pool
```js
{
  id, topic,
  q,                       // question text
  choices: [ "...", ... ], // 3–4 options
  answer: <index>,         // correct choice
  trap?: <index>,          // optional "tempting-but-wrong" choice → extra penalty
  explain                  // one-line explanation shown after answering
}
```
~18–20 questions across topics; each play draws a shuffled subset (~8–10 MCQ) so replays differ.

### 3.3 Topics (span both lectures)
`scan-levels` (MS1/MS2/MS3, where quant is read) · `feature` (isotopes×charge×elution, precursor intensity = XIC area) · `acquisition` (DDA vs DIA) · `methods` (LFQ/SILAC/TMT/DIA, iBAQ — Kathryn) · `mbr` · `normalization` · `rollup` (peptides→protein, protein groups) · `missing` (imputation).

Each topic carries a `review` string (what to revisit) surfaced on the Results screen.

---

## 4. Mini-games (5, SVG)

Each mini-game is a self-contained module in `games/<name>.js` exposing a single interface:

```js
export function render(container, { onDone }) { /* draw SVG; call onDone({ correct, scoreDelta, explain }) when solved */ }
```

The engine treats a mini-game exactly like an MCQ round: it hands over a container + `onDone`, shows the same feedback bar, and adds `scoreDelta` to the score. This keeps games and questions interchangeable in the round sequence.

1. **Read the envelope** (`feature`) — an isotope envelope (SVG stems). Task: click the **monoisotopic** peak (left-most), then choose the **charge** from peak spacing (buttons 1+/2+/3+). Correct peak + correct charge = full points.
2. **Pick the real feature** (`feature`) — a crowded RT×m/z map (SVG blobs). Prompt: "your peptide is at m/z 900, RT 30 s." Click the right blob; the co-eluting near-m/z neighbour is a **trap** (interference → penalty).
3. **Guess the method** (`methods`) — a small acquisition schematic (samples → run(s), where the number is read). Identify **LFQ / SILAC / TMT / DIA** from 4 buttons. Randomised among a few schematics.
4. **Quant detective** (`missing`) — a 2-row mini matrix (ctrl vs treated). One protein is missing-in-all-controls (imputed → fake "16× up"), one is measured everywhere (real 2×). Task: pick the **trustworthy** up-regulation. Choosing the artifact = penalty.
5. **Match between runs** (`mbr`) — two runs of peptide dots; **drag** each Run-2 dot to its Run-1 match (RT drifted ~+1 min). A decoy dot at the same m/z but wrong RT must be left **unmatched** (dragging/accepting it = false transfer → penalty). Pointer + touch drag.

All mini-games are **responsive SVG** with large tap targets; work on phone and laptop.

---

## 5. Scoring (`score.js`)

- **Base**: +100 per correct MCQ / mini-game objective.
- **Speed bonus**: up to +50 scaled by remaining time on timed MCQs (mini-games: fixed base, no speed pressure so students can think).
- **Streak multiplier**: consecutive correct → ×1.1, ×1.2 … capped at ×1.5.
- **Trap penalty**: choosing a `trap`/artifact/false-transfer = −50 (judgment matters more than raw recall).
- **Final tier** by % of max: Gold ≥ 85, Silver ≥ 65, Bronze ≥ 40, else "Keep training."
- **Badge** from strongest topic accuracy: e.g. Feature Hunter (feature), Scan-Level Sage (scan-levels), Batch-effect Buster (missing/normalization), Method Maven (methods).
- **Per-topic accuracy** tracked (correct/seen per topic) → Results bars + review pointers.

All computed client-side; deterministic given answers.

---

## 6. Architecture (vanilla JS, zero-build)

Flat, dependency-free, GitHub-Pages-ready:

```
index.html          # single page; mounts #app
style.css           # teal/orange palette matching the lecture
main.js             # state machine: welcome → training → play → results; HUD; round loop
content.js          # training cards + MCQ pool + topic metadata (DATA)
games/
  envelope.js       # mini-game modules, each exporting render(container,{onDone})
  feature.js
  method.js
  detective.js
  mbr.js
  svg.js            # tiny shared SVG helpers (stems, blobs, axis)
score.js            # scoring, tiers, badges
storage.js          # localStorage: name, best score; submitScore() stub (leaderboard seam)
README.md
```

- **No framework, no bundler.** ES modules loaded via `<script type="module">`. Works directly on GitHub Pages (served over http). For local dev, run any static server (`python3 -m http.server`) — ES modules do **not** load over `file://`. README documents this.
- **State** lives in a single in-memory object in `main.js`; screens are render functions that swap `#app` innerHTML and wire events.
- **Interchangeable rounds**: MCQ and mini-games share the `{ onDone }` contract, so the round sequence is just an array the engine walks.

### 6.1 Leaderboard seam (future)
`storage.js` exposes `submitScore({ name, score, tier, perTopic })`. v1 implementation: store best locally + build a shareable result string. Later: swap the body to `fetch(POST)` a serverless endpoint / Google Apps Script / Firebase — **no other file changes**.

---

## 7. Visual style

Reuse the lecture's language so the game reinforces the slides:
- Palette: deep teal `#0A3D52`, teal `#00979D`, orange `#E86A1C`, light teal `#D5ECED`, grey `#404A4F`.
- Clean sans, generous spacing, big buttons, mobile-first.
- Mini-game SVGs echo the deck figures (isotope stems, RT×m/z blobs, reporter bars).

---

## 8. Testing

- **Manual test checklist** in README: full playthrough on desktop + mobile viewport; each mini-game solvable + trap penalised; timer/streak/score correct; results tiers at boundary %s.
- **Lightweight logic tests**: a `tests.html` (or console harness) that imports `score.js` and asserts tier/streak/penalty math on fixed inputs. No test framework needed (plain assertions).
- Content sanity check: every MCQ has a valid `answer` index and an `explain`; every topic has a `review`.

---

## 9. Hosting

- Repo `ypriverol/be-the-algorithm`, GitHub Pages served from `main` branch root (or `/docs`). No Action needed (static).
- `README.md`: what it is, how to play, how to add a question/card (edit `content.js`), how to add a mini-game (drop a `games/*.js` with the `render` contract), and the leaderboard-later note.

---

## 10. Open questions

None blocking. Deferred to later versions: shared leaderboard backend; more topic modules (DIA depth, stats); sound/animations; i18n.
