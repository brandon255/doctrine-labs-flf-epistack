# Screencast — shot list and narration

**Purpose:** a reviewer who will not install a 5GB model still gets to watch the tool
work. Three minutes, one take if possible, no editing required.

**Who records this:** Brandon. It needs your voice and your screen — that is the
whole point of it existing. The agent cannot record it for you.

**Where it goes:** YouTube unlisted → linked at the top of `docs/transcripts/README.md`,
in `COVER_NOTE_TO_FLF.md`, and on the local landing page.

---

## Before you hit record

**GOAL:** a clean terminal and browser with nothing personal on screen.

1. **Terminal:** new window, font size up (Cmd-+ three or four times). A judge may be
   watching on a laptop.
2. `cd ~/Desktop/doctrine-labs-flf-epistack`
3. `clear`
4. **Ollama running:** `ollama serve` in a second tab, then leave that tab alone.
5. **Browser:** one window, one tab, no bookmarks bar, no extensions visible.
   Close Slack, mail, and anything that pops a notification.
6. **Do not Not Disturb:** turn it ON. A notification banner in the recording means
   re-recording.

**Recorder:** QuickTime → File → New Screen Recording → record the whole screen, or
Cmd-Shift-5. Include microphone audio (click the arrow next to Record → your mic).

**VERIFY:** do a 10-second throwaway recording first and play it back. Confirm you can
hear yourself and read the terminal text. This one check saves re-shoots.

---

## Shot 1 — the problem, in one command (0:00–0:35)

**On screen:**

```bash
node scripts/epistemic-run.js covid
```

Let the output scroll. Scroll back up to the assessment line and leave it on screen.

**Say, roughly:**

> This is a corpus about COVID origins. Twenty-one excerpts, all accurately quoted, all
> correctly attributed. The tool reads it and says: those twenty-one excerpts come from
> eight documents, and those eight documents trace back to three independent
> observations of the world. Treat it as three sources, not twenty-one.
>
> I want to be clear that this corpus was mine, and when I first built it the tool
> reported nineteen independent sources. There were three. Judge Will's twenty-seven
> page decision had been entered as three separate sources because I'd pulled three
> quotes out of it. That bug is why the rest of this exists.

**VERIFY:** the line `21 excerpts cited, drawn from 8 documents, tracing to 3
independent lineage(s)` is legible on screen.

---

## Shot 2 — it runs cold (0:35–1:00)

**On screen:**

```bash
npm test
```

**Say:**

> Before I show the AI part — none of what you just saw needed a model. That was Node
> and nothing else. A hundred and fifty-seven tests, no network, no API key, no install
> step. The independence math, the citation checking, and all eight of the mechanical
> challenger checks run on any machine that has Node on it.
>
> The model is optional, and it only does two things. I'll show you those next.

**VERIFY:** `# pass 157` and `# fail 0` visible.

---

## Shot 3 — the protocol, live (1:00–2:20)

**On screen:**

```bash
node scripts/adjudicate-run.js eggs crux
```

This takes about a minute. **Do not cut it out.** Talk over the wait.

**Say, while it runs:**

> This is the part that needs the model, and it's a minute on my machine, so let me
> tell you what it's doing while we wait.
>
> Stage one, the model proposes an answer and has to show its work — every reasoning
> step cites an evidence ID and quotes the text it's leaning on.
>
> Stage two, every one of those citations gets checked against the corpus
> mechanically. No model in that step. If the model says a quote is in block four, we
> go look in block four. Shown work you can't check is decoration.
>
> Stage three is the challenge, and this is the part I got wrong the first time. I had
> the challenger running on the same model as the proposer. So by my own framework I
> was reporting one source as two, inside the machinery that exists to catch exactly
> that error. Caught it with the tool. It's a panel now.

When output appears, scroll to the **Challenge panel** section.

**Say:**

> There it is. Two challengers, two independent lineages. The first one is
> deterministic — no model at all, eight structural checks — and look what it found: every
> block the model cited traces back to one lineage, out of five available. It's making a
> claim about independence while resting on a single source. The second challenger is a
> different model family, qwen instead of llama, and it can see the conclusion but not
> the reasoning, because a model shown its own reasoning defends it.
>
> Verdict: contested. Independence: moderate — and it says moderate rather than strong,
> because I haven't recorded my own position yet. It won't round up.

**VERIFY:** the `Challenge panel — independence: MODERATE` block is on screen and readable.

---

## Shot 4 — pointing it at myself (2:20–3:00)

**On screen:** open `docs/epistemic/self/evidence_blocks.json`, scroll to
`self-rarity-funnel-FLAWED`.

**Say:**

> Last thing. There's a fourth case in here and it's the tool run against claims about
> me.
>
> Some of these are real measurements — it re-runs `git log`, it re-runs `npm test`, and
> it checks that the number I claimed is the number the command actually returns. And
> two of them are deliberately wrong. This one takes eleven personality and background
> traits, multiplies their prevalences together, and concludes something very flattering
> about how rare I am.
>
> The tool rejects it. Three objections. Rarity isn't a measurable quantity, the headline
> number appears in none of the cited measurements, and the things being multiplied
> declare in their own metadata that they're correlated with each other — so multiplying
> them is the same error as counting twenty-one excerpts as twenty-one sources. One
> lineage, counted eleven times.
>
> I put that in on purpose. A tool whose author only ever points it at other people's
> reasoning is a less interesting tool.

---

## Shot 5 — close (3:00–3:20)

**Say, to camera or over the repo page:**

> It's MIT, it's yours, there are no strings on it. If the local-first approach or the
> human-gate idea is interesting, I'd like to talk. And I'd genuinely like to know where
> you think it breaks — there are four open questions in section eight of the spec I
> couldn't resolve on my own.
>
> Thanks for running the competition. It made me finish something I'd been circling for
> months, and then it made me find a real bug in my own work.

---

## After recording

1. **Watch it once, all the way through.** If a notification appeared or audio dropped,
   re-record — it is three minutes.
2. Upload to YouTube, visibility **Unlisted**.
3. Title: `FLF Epistemic Stack — a three-minute walkthrough`
4. Paste the URL into the three places listed at the top of this file.

**IF STUCK:** if a live run fails on camera, keep it and say so out loud — *"that's an
unverified verdict, and here's why that's the tool working."* An honest failure on
camera is worth more than a fourth take. Every transcript in `docs/transcripts/`
already ships the failures for the same reason.
