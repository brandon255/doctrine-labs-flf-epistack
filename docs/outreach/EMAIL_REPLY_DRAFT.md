# Email reply draft — for Brandon to edit and send

**Subject:** Re: early feedback on the epistack submission

**Attach:** `docs/outreach/FLF_HOW_IT_WORKS.pdf`  
(Human-written how-it-works note for FLF. No named recipient in the PDF.)

---

Hi,

Thanks for the early look. The feedback landed. Three things you said, and
where each one is now.

Attached: a short PDF, *How the FLF Epistemic Stack works*, written in the
same voice as the Jun 21 / Jul 19 packets. Co-written with Cursor (I call it
Rivet). Same trade as before: I architect and verify; the agent implements;
I own the result.

How to run it (three paths: read-only, double-click, terminal):
`docs/outreach/FLF_INSTRUCTIONS.md` in the repo.

**"Couldn't access the linked git repo."**

That was my fault. The repo was private and I sent a link, not access. It's
public now, and it clones clean from a fresh checkout:

  https://github.com/brandon255/doctrine-labs-flf-epistack

If you'd rather not clone anything, the no-install path is
`docs/transcripts/`. 26 frozen runs of the full protocol, readable as plain
markdown on GitHub. Nothing to install, nothing to break.

**"Fully LM-written and difficult to follow."**

Fair. The version you saw was written fast under pressure and it showed. The
tool underneath was sound. The explanation wasn't. I rewrote the reader-facing
docs in my own voice.

If you only read three things:

  1. `COVER_NOTE_TO_FLF.md` — what it is, short.
  2. `SPEC.md` — the methodology, decisions and tradeoffs, written by me.
  3. `docs/DEFECT_REGISTER.md` — the bugs I shipped, what each one would have
     cost a reader, and the test that now guards it. Every line in there is
     checkable: `npm run verify:register` fails if a guard is missing.

**"Cleaner human-written explanation of the core contribution, with working
demonstrations that are accessible and traceable."**

The core contribution, in one sentence: a pile of citations often traces to a
small number of underlying observations, and this tool counts the
observations, not the citations, then checks whether a conclusion drawn from
them survives a challenge from something that cannot share the author's blind
spots.

Here's what changed since the version you saw.

The version you reviewed was a provenance genealogy layer. It counted how many
distinct roots sat under a pile of citations. That was a real contribution and
you named it accurately in your feedback. But it was the navigation layer, not
the assessment layer.

This is the assessment layer. The tool now adjudicates conclusions drawn from
evidence, not just maps where they came from. A model judgment has to show
cited reasoning, survive a mechanical challenger that shares no weights with
it, and be accepted by a human who is counted as a distinct lineage on the
panel.

Three cases are wired up. COVID origins, LHC safety, eggs/cholesterol. Plus a
fourth that's recursive: the tool adjudicates claims about its own author. That
one caught me overstating things in my own evidence, and the register says so
out loud.

Live demos are in `docs/transcripts/` if you'd rather read than run. If you do
want to run it, it's Node 20 and nothing else. No install, no API key, no
network. There's a small web UI in the repo if you want to click around.

A short comparison to adjacent tools is in `docs/PRIOR_ART.md`, including the
blanks in my row. The things Elicit and Scite do that this doesn't.

One thing straight, because I'd rather you hear it from me than find it later.
I'm six months into software. Sixteen years of industrial design before that.
The methodology is mine and every claim in the repo is checkable. But I'm still
learning the domain. If something in here is wrong, I'd rather know than be
politely spared.

Whatever the competition decides, this has been worth building. Thanks again
for the early read. It moved the work.

Brandon

---

## Notes for Brandon before you send

**Attachment name:** `FLF_HOW_IT_WORKS.pdf` — FLF-facing, no personal name in
the file or the PDF body. Attach that. Do not attach anything named for a
person.

**Greeting:** This draft says "Hi," on purpose so the repo copy stays generic.
When you paste into your mail client, put the recipient's name yourself if you
want. Do not commit that name back into the repo.

**Read it out loud.** Change any word that doesn't sound like you.

**Tone flags:**
1. Own the private-repo miss factually. Don't grovel.
2. "Written fast under pressure" owns the nervousness without apologizing for
   the tool.
3. Six-months paragraph is continuity with Jun 21 / the cover letter, not a
   confession.

**After you send: stop checking for 72 hours.** The gift is given.
