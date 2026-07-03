# Shared leaderboard — setup (Google Sheet + Apps Script)

The app is static, so the shared board lives in a Google Sheet you own. One free,
~5-minute setup. Players never sign in; the Sheet is the full trace of everyone who
played, and you can open, sort, or delete rows anytime.

## 1. Create the Sheet + script
1. Create a new **Google Sheet** (any name).
2. **Extensions → Apps Script**. Delete the sample code and paste the script below.
3. **Save** (disk icon).

## 2. Deploy it as a Web App
1. **Deploy → New deployment**.
2. Gear icon → select type **Web app**.
3. **Execute as:** *Me*.  **Who has access:** *Anyone*.
4. **Deploy**, authorize when prompted, and **copy the Web app URL** (it ends in `/exec`).

## 3. Turn it on in the app
1. Open `config.js` in the repo and paste the URL:
   ```js
   export const LEADERBOARD_URL = 'https://script.google.com/macros/s/AKfy…/exec';
   ```
2. Commit & push to `main` → GitHub Pages redeploys → the **Class board** appears on the
   results screen and every finished game is appended to your Sheet.

> To turn the board off again, set `LEADERBOARD_URL` back to `''`.
> Because the app is public and has no login, anyone can submit a name/score. For a course
> that's fine; just delete any junk rows from the Sheet.

## The Apps Script

```javascript
// QuantQuest — leaderboard backend
const SHEET_NAME = 'scores';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(['time','name','score','tier','badge']); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Append one finished game.
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const name  = String(d.name  || 'anon').slice(0, 24);
    const score = Math.max(0, Math.min(100000, parseInt(d.score, 10) || 0));
    const tier  = String(d.tier  || '').slice(0, 20);
    const badge = String(d.badge || '').slice(0, 40);
    sheet_().appendRow([new Date(), name, score, tier, badge]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Return the top N scores.
function doGet(e) {
  const top = Math.max(1, Math.min(100, parseInt((e && e.parameter && e.parameter.top) || '20', 10)));
  const sh = sheet_();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues() : [];
  const list = rows
    .map(r => ({ time: r[0], name: r[1], score: Number(r[2]) || 0, tier: r[3], badge: r[4] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
  return json_({ ok: true, top: list, count: rows.length });
}
```
