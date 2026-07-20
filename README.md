# Provenance genealogy layer

A small tool you run in one command. It answers one question about a pile of evidence: how many of these citations actually come from different original sources, and how many are the same source wearing different hats?

I am Brandon Flores. I am an industrial designer, about six months into writing software. I built this as one slice of a larger local-first system I call Core OS. I put it in its own public repo so a judge can clone it, run one command, and read the result without trusting a screenshot or cloning anything private.

## The problem, in plain terms

When you gather evidence on a hard question, it is easy to count the number of citations and treat that as the number of independent confirmations. It usually is not. Five citations can all trace back to one report. That is one source, not five.

I ran into this in my own data. I already had two safeguards in Core OS. One is an integrity ledger that catches tampering. The other is a human approval gate that stops the machine from rubber-stamping its own work. Neither one asked the question that actually mattered here: how many distinct roots are under these blocks? So I built the part that does.

When you run it, it prints one line:

```
N blocks cited; M distinct roots; K correlated cluster(s) detected. Treat as M independent sources, not N.
```

## Run it

No dependencies. You need Node 20 or newer. There is nothing to install.

```bash
npm run epistemic:covid
```

Also available:

```bash
npm run epistemic:lhc
npm run epistemic:eggs
npm run epistemic:all
```

## What you should see (COVID case)

```
21 blocks cited; 19 distinct roots; 1 correlated cluster(s) detected. Treat as 19 independent sources, not 21.
```

The command prints a full report and a JSON summary underneath it.

## The three cases

These are the three starter cases from the competition. In each one I am not trying to settle the question. I am measuring how independent the cited evidence actually is.

| Command | Question it is pointed at | Result |
|---------|---------------------------|--------|
| `epistemic:covid` | COVID-19 origins (the Wilf-Miller debate record): what do the cited blocks trace back to? | 21 blocks, **19 distinct roots**, 1 correlated cluster |
| `epistemic:lhc` | Could Large Hadron Collider collisions create a dangerous black hole? | 9 blocks, **6 distinct roots**, 2 correlated clusters |
| `epistemic:eggs` | Are eggs bad for you? | 9 blocks, **6 distinct roots**, 2 correlated clusters |

## How it works (three steps)

1. Each claim is stored as a block with its citation, in `docs/epistemic/<case>/evidence_blocks.json`.
2. Each block carries a `root_source_id`. Blocks that trace to the same origin share that id.
3. The resolver groups blocks by root, counts the distinct roots, and reports the gap between how many blocks you have and how many independent sources you actually have.

The core files:

- `src/epistemic/genealogy.js` groups blocks by root and counts distinct roots
- `src/epistemic/ingest.js` loads a case and runs it
- `src/epistemic/report.js` writes the readable report
- `scripts/epistemic-run.js` is the command you run

## Where the human judgment lives (and why it is on purpose)

A human assigns the root tags. The tool counts them; it does not discover them. It will not read two differently worded articles and quietly work out that they came from the same place. Deciding that two blocks share a root is a judgment call, and I think that call belongs to a person. What the tool adds is that once a person makes that call, the consequence shows up in the count. One source quoted three times can no longer pass as three confirmations.

Here is the exact human judgment in each case, so you can see my work:

- **COVID origins:** three blocks (`covid-seed-001`, `002`, `004`) are tagged as tracing to the one FLF competition brief. That is why 21 blocks come out as 19 roots.
- **LHC black holes:** three blocks are tagged to the LSAG safety report (`lsag-arxiv-0806.3414`), and two more to the FLF brief. That is why 9 blocks come out as 6 roots.
- **Eggs:** three blocks are tagged to the Zhong 2019 JAMA study (`zhong-jama-2019-2728487`), and two to the FLF brief. That is why 9 blocks come out as 6 roots.

## Reading the output

- **Blocks** is how many pieces of evidence were cited. **Distinct roots** is how many different original sources those actually trace to. A **correlated cluster** is a group of blocks that share one root, so they should count as one source, not several.
- Under the readable report, the command also prints a JSON summary with the same numbers, in case you want to feed it into your own tooling.
- The report lists the exact links it merged, under "same_cluster edges", so you can see precisely which blocks were treated as one source. In the COVID case, that is where `covid-seed-001`, `002`, and `004` show up tied together.

And it is all here to try. Open any of the three cases and run it. If you are curious, change a root tag and run it again to see how the count shifts. There is also a small worked example you can copy: run `npm run epistemic:sample`, then open `docs/epistemic/sample/evidence_blocks.json` and edit it to point the tool at evidence of your own.

## Scaling the judgment, and standing up to relabeling

The one weakness in the plain version above is this: the correlation is only caught if a person tags two blocks with the same `root_source_id` when the evidence goes in. That does not scale, and it is exactly the move an adversary would make to inflate independence. Give the same underlying report a fresh identifier and it slips through as a new source.

So there is a second, optional layer: an alias map. A file named `aliases.json` in a case folder declares that two different-looking identifiers trace to the same root:

```json
{ "trade-magazine-writeup": "acme-coating-report-2024" }
```

The resolver applies that map before it counts, so the relabeled source collapses back into the one it actually came from. You do not have to touch the evidence blocks to do it. That matters for three reasons:

- **It scales.** One alias declaration fixes every block that used that identifier, and it can grow independently of the evidence. As models get better at spotting "this is the same source under a new name," that judgment can be proposed automatically and written straight into `aliases.json`. The tool stays the same; the map gets smarter.
- **It resists relabeling.** An adversary cannot manufacture independence just by renaming a source, once that alias is declared.
- **It compounds and travels.** The alias map is a small, portable artifact. One person's work identifying shared roots can be handed to the next person, or merged, without re-reading the underlying evidence.

You can watch it work in the sample case. `sample-2` carries its own identifier, so on its own it counts as a separate source:

```
# with docs/epistemic/sample/aliases.json in place
3 blocks cited; 2 distinct roots; 1 correlated cluster(s) detected. Treat as 2 independent sources, not 3.

# delete aliases.json and run again
3 blocks cited; 3 distinct roots; 0 correlated cluster(s) detected. Treat as 3 independent sources, not 3.
```

The alias map is what turned three "independent" sources back into two.

## What this is not

I want to be straight about the limits, because that matters more than any pitch.

- It matches on an explicit id (`root_source_id`), optionally routed through an alias map, not on meaning. It will not read two articles and infer on its own that they came from the same place. A person or a model still has to declare the roots and the aliases. What the alias map buys you is that the declaration is made once, scales, and cannot be undone by a simple rename.
- The case data is hand-curated, not scraped. This is a reasoning tool, not a crawler.
- It does not settle COVID origins, black-hole risk, or egg nutrition. It tells you how independent your evidence really is for whatever side you hold.
- Any em-dashes you see in the output are inside the cited claims and source excerpts. That is evidence text, and I left it as written. In a competition about evidence, editing a source to make it look tidier is the one thing I will not do.

## Who built this and why

I am an industrial designer with about sixteen years shipping physical product, and roughly six months in software. I am not a senior engineer and I am not a virologist. What I bring is a designer's habit: take a fuzzy worry, in this case "are these sources really independent?", and turn it into one command with the least interpretation required of the person reading it. In fabrication I spent years shortening the time between a decision and knowing whether it was right. This is that same instinct aimed at evidence.
