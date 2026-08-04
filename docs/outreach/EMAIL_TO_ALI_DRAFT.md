# Email draft to Ali — for Brandon to edit and send

**Subject:** Re: early feedback on the epistack submission

---

Hi Ali,

Thanks for taking the early look, and for the feedback — it helped. Three things
in particular you said, and where each one landed:

**"Couldn't access the linked git repo."** The repo is now public and clones
clean from a fresh checkout. I tested it as a stranger would.

  https://github.com/brandon255/doctrine-labs-flf-epistack

If you'd rather not clone anything, there's a no-install path: `docs/transcripts/`
holds 26 frozen adjudication runs you can read as plain markdown, each one the
full four-stage protocol captured verbatim.

**"Fully LM-written and difficult to follow."** Fair, and I rewrote the reader-
facing docs in my own voice. The path I'd suggest if you only read three things:

  1. `COVER_NOTE_TO_FLF.md` — what this is, in under a page.
  2. `SPEC.md` — the methodology, decisions and tradeoffs, written by me.
  3. `docs/DEFECT_REGISTER.md` — the bugs I shipped, what each would have cost
     a reader, and the test that now guards it. Every claim in there is
     checkable: `npm run verify:register` fails if a guard is missing.

**"Cleaner human-written explanation of the core contribution, with working
demonstrations that are accessible and traceable."** The core contribution, in
one sentence: a pile of citations often traces to a small number of underlying
observations, and this tool counts the observations, not the citations. Three
cases are wired up — COVID origins, LHC safety, eggs/cholesterol — plus a
recursive fourth where the tool adjudicates claims about its own author.

The live demonstrations are in `docs/transcripts/` if you'd rather read than
run. If you do want to run it, it's Node 20+ and nothing else — no install, no
API key, no network. The mechanical half of the protocol runs cold; the local-
model half is optional.

One thing I want to be straight about: I'm six months into software, coming
from sixteen years of industrial design. The methodology is mine — three-level
independence, the adjudication protocol, the defect register — but I'm still
learning the domain and I'd rather say that plainly than have you find out
later. A short comparison to the adjacent tools is in `docs/PRIOR_ART.md`,
including the blanks in my row.

Whatever the competition decides, this has been worth building. Thanks again
for the early read.

— Brandon

---

## Notes for Brandon before you send

- **Don't send this verbatim.** Read it out loud and change anything that
  doesn't sound like you. The goal is your voice, not mine.
- **The three-things structure mirrors Ali's email exactly.** He listed three
  pieces of feedback; you're showing each one was heard and acted on. That's
  not a formula, it's just respect for the time he spent.
- **The "six months into software" line is the most important sentence in
  the email, and the hardest to send.** It costs you nothing to say and
  everything to hide. Ali already knows — your commit history is public and
  short. Saying it first takes the weapon out of anyone else's hands.
- **I left out the comparison chart on purpose.** `PRIOR_ART.md` is linked at
  the end as a quiet pointer, not featured. If Ali wants it, it's one click.
  Putting it in the email is what would make it a brag.
- **Subject line.** "Re:" keeps it in the existing thread, which is the right
  place. If you start a fresh thread, use: "Updated epistack submission —
  public repo, human-written docs, working demos."
- **Send from the address Ali already replied to.** Continuity matters.
