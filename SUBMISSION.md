# A runnable check for hidden correlation in evidence

**Future of Life Foundation, Epistemic Case Study competition**
Brandon Flores, Doctrine Labs
Live demo: https://github.com/brandon255/doctrine-labs-flf-epistack

---

## 1. Core contribution

The way my brain works comes from the shop. For sixteen years I ran a vertically integrated design studio, with CNC machining, laser cutting, injection molding, casting, and RF welding under one roof, so we could take an idea to a finished part fast. A recruiter once asked me for my most successful project. It was helping a new inventor with a radio-frequency welding and tooling job. Done the usual way it would have cost him a hundred to two hundred thousand dollars and a year or more. We did it for around fifteen thousand in three to five weeks. The real win was not the money. It was that he found out fast whether it was a bad idea, instead of burning a year to learn the same thing.

My genealogy layer does that for evidence. In one sentence: it tells you, up front and in one run, which of your "independent" sources are really the same source, so you do not spend months building confidence on evidence that was never as independent as it looked. That is time-to-knowing, applied to an argument instead of a product. It is the same instinct that once compressed a product's cost through vertical integration, now aimed at compressing a pile of evidence down to one honest line.

## 2. How I got here, and how I found it

I did not set out to enter a competition. I started Core OS in March or April because building with cloud tools, Claude Code, Perplexity, and ChatGPT, was costing too much, so I wanted to run local models instead. Later I saw the FLF competition on LinkedIn. The terminology was over my head, but my gut said Core OS already did a lot of what they were asking. They posted the competition in June 2026, and I had been building before that, so this is convergent, not built to win.

I ran their COVID case through it. The correlated blocks were already in my own data, and my existing safeguards missed them. The integrity ledger only catches tampering. The oversight only catches rubber-stamping. Neither noticed that three blocks traced back to the same source. Once the genealogy step was in, the tool said it plainly: three blocks, one root. I did not hand-tune anything to get that, and you can re-run it yourself.

## 3. What it does, in three plain steps

1. Every claim is stored as a small "evidence block" that records where it came from.
2. Each block is tagged with a `root_source_id`, its real origin: the primary paper, docket, or dataset. Blocks that share a root are grouped into one cluster and marked correlated.
3. When it reports, it counts distinct roots, not blocks, and prints one honest line. For example: "21 blocks cited; 19 distinct roots; 1 correlated cluster(s) detected. Treat as 19 independent sources, not 21." You see that before you weigh anything.

## 4. Why my existing safeguards missed it

Core OS already had two guards, and neither caught this.

- The integrity ledger catches tampering. If a stored claim is edited, the hash chain breaks. It says nothing about whether two claims share a source.
- The human gates catch rubber-stamping. You have to explain why before a write goes through. That stops lazy approvals, not shared origins.
- Neither one asks the question "do these pieces trace back to the same place?" That gap is what the genealogy layer fills.

## 5. Where the human judgment lives

I want to be straight about the thing that matters most, so nobody has to guess. A human assigns the root tags. The tool counts them; it does not discover them. Deciding that two blocks share a root is a judgment call, and I think that call belongs to a person. What the tool adds is that once a person makes that call, the consequence shows up in the count. One source quoted three times can no longer pass as three confirmations. It is all there in the data, so anyone can open a case, run it, and follow exactly how the count comes together.

## 6. Demonstration

There is a public repo you can clone and run with no setup beyond Node. It has no dependencies to install.

- `npm run epistemic:covid` gives 21 blocks, 19 distinct roots, 1 correlated cluster.
- `npm run epistemic:lhc` gives 9 blocks, 6 distinct roots, 2 correlated clusters.
- `npm run epistemic:eggs` gives 9 blocks, 6 distinct roots, 2 correlated clusters.
- `npm run epistemic:all` runs all three.

Every run prints a readable report and a JSON summary. There is also a small worked example, `npm run epistemic:sample`, that you can copy and point at evidence of your own.

Link: https://github.com/brandon255/doctrine-labs-flf-epistack

## 7. Generalization, three cases in three different shapes

Same resolver, same report format, three deliberately different case shapes.

- COVID, a contested and curated debate: 21 blocks to 19 roots, 1 correlated cluster, where three seed blocks all trace to the FLF competition brief.
- LHC and black holes, a mostly closed case resting on a large body of knowledge: 9 blocks to 6 roots, 2 clusters, where official summaries restate the same safety assessment and get counted as one, not many.
- Eggs, a mundane and open-ended question: 9 blocks to 6 roots, 2 clusters, where several findings trace to the same study and cohort.

One codebase, three cases. That is the "does it generalize?" answer, in their own three shapes.

## 8. Honest limits, and how it scales

- It matches on the source's identifier, not on meaning. On its own it will not read two write-ups of the same study and work out that they came from the same place. That is the real limit, and I want to name it first.
- To push past it, I added an alias map: a small file that declares two different-looking ids are the same origin, applied automatically before the count. You can watch it work in the sample case. With the alias file in place, three sources collapse to two; delete the file and it counts three again. This is also what stops the obvious gaming move, because an adversary cannot manufacture independence just by renaming a source once that alias is declared.
- It scales because one alias declaration fixes every block that used that id, and a model can propose those declarations as models get better at spotting the same source under a new name. The tool stays the same; the map gets smarter. Getting evidence in is still human-curated today, and a person still steers that step.
- Identifier clustering, even with aliases, is not the same as true independence. It is a floor, not a proof.
- It does not settle COVID origins, LHC safety, or whether eggs are good for you. It helps you navigate the evidence, not decide the answer.

## 9. Who I am, and what I am not claiming

I am an industrial designer, sixteen years shipping physical product, about six months building software, all of it with AI in the loop and openly so. I learn answer-first: do the work, check it against the answer, reverse-engineer the mistake. That started in college, when I ordered a textbook and accidentally got the teacher's edition with the answers, and taught myself by working backward from them. I build for the least interpretation the user has to do, which is why I care that this runs and reads plainly.

This tool is one slice of Core OS, a local-first system I build. Core OS puts AI in the loop for human enhancement: the AI is there to sharpen the person's judgment, not to replace it. It runs entirely on your own machine and does not need a cloud model to work, and anything that would write data or leave the system passes a human approval gate first. It holds evidence in a vault with an integrity ledger, so stored claims cannot be quietly changed. Most agentic AI I have seen learns tools and workflows to make the agent itself more capable; I have not found one built to learn about its human in order to strengthen the human. That is what Core OS is for. None of this is slideware: a sibling execution stack I call ICM Core runs the same vault and gate discipline end to end, most recently passing five of five gates. The genealogy layer is the part of it that keeps one source from counting as many.

What I am not claiming: I did not settle COVID origins. I am not a credentialed researcher or a senior engineer. I am not claiming that nobody else has noticed correlated evidence, because FLF names it themselves. I built a small, runnable piece that makes it visible, and I am showing my work.
