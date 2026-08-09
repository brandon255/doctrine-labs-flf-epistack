# FLF Epistemic Stack — how to run it

**Brandon Flores** · Doctrine Labs  
**Repo:** https://github.com/brandon255/doctrine-labs-flf-epistack  
**Contact:** open an issue on the repo, or reach me via the FLF Epistack contest channel.  

Three paths. Pick one. You do not need all three.

---

## Path 1 — Read only (no install)

**GOAL:** See full adjudication runs without installing anything.

**WHERE:**  
https://github.com/brandon255/doctrine-labs-flf-epistack/tree/main/docs/transcripts

**HOW TO OPEN:** Click any `*.md` file in that folder (e.g. `covid-lineage.md`, `self-lineage.md`).

**WHAT YOU GET:** Verbatim propose → verify → challenge → resolve records. 25 frozen runs plus the folder index (`docs/transcripts/README.md`).

**VERIFY:** You can read a complete run in the browser. No clone, no Node, no model.

**IF STUCK:** Open `COVER_NOTE_TO_FLF.md` in the repo root first, then come back to transcripts.

---

## Path 2 — Double-click runner (Mac or Windows)

**GOAL:** Start the local UI and run cases on your machine.

**WHERE (after clone):** repo root  
`doctrine-labs-flf-epistack/`

**HOW TO OPEN:**

1. Clone or download the repo.
2. Install **Node 20+** if you do not already have it (https://nodejs.org).
3. Double-click:
   - **Mac:** `RUN-EPISTACK.command`  
     (first time: right-click → Open if Gatekeeper blocks it)
   - **Windows:** `RUN-EPISTACK.bat`

**WHAT YOU GET:** Local server + browser UI (default `http://127.0.0.1:4318`).

**VERIFY:** Browser opens; case list loads; you can open COVID / LHC / eggs / self.

**IF STUCK:** Use Path 3 (terminal). Or fall back to Path 1 (transcripts).

**Note:** A local LLM (Ollama) is optional. The mechanical half of the protocol runs without it. The UI will say when no model is present — that is a supported mode.

---

## Path 3 — Terminal (advanced)

**GOAL:** Same engine as Path 2, from the command line.

**WHERE:** repo root, after clone.

**HOW:**

```bash
git clone https://github.com/brandon255/doctrine-labs-flf-epistack.git
cd doctrine-labs-flf-epistack
npm test
node scripts/epistemic-run.js covid
npm start
```

Other cases: `lhc` · `eggs` · `self` · or `npm run epistemic:all`.

**VERIFY:**

- `npm test` → 188 passing, no network  
- `epistemic-run` prints an assessment line (lineages, not raw citation count)  
- `npm start` → UI at `http://127.0.0.1:4318`

**IF STUCK:** Path 1. Nothing in Path 1 depends on Node.

---

## What to read (order)

| Order | File | Why |
|-------|------|-----|
| 1 | `COVER_NOTE_TO_FLF.md` | What this is, under a page |
| 2 | `docs/outreach/FLF_HOW_IT_WORKS.md` (or the PDF) | How the four stages work |
| 3 | `docs/transcripts/` | Working demos, no install |
| 4 | `SPEC.md` | Methodology and tradeoffs |
| 5 | `docs/DEFECT_REGISTER.md` | Bugs shipped + guarding tests |

---

## What you need / do not need

| Need | Do not need |
|------|-------------|
| Node 20+ only if you run Path 2 or 3 | API key |
| Browser for Path 1 or the UI | Network (after clone) |
| Optional: Ollama for live LLM propose/challenge | Cloud account |

---

## Contact

Open an issue on the repo, or reach me via the FLF Epistack contest channel.

*Doctrine Labs · FLF Epistemic Stack*
