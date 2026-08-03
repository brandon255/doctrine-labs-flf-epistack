/**
 * Assessment jobs — the standing questions this stack knows how to adjudicate.
 *
 * Each maps to a desideratum from the FLF competition brief's assessment layer.
 * They share one mechanism (see adjudicate.js), so adding a job is a matter of
 * writing a question and its guidance, not new plumbing.
 */

export const ADJUDICATION_JOBS = {
  lineage: {
    label: "Correlated evidence",
    desideratum: "Flag correlated evidence being treated as independent",
    question:
      "Which evidence blocks in this corpus trace back to the same underlying source or event, and should therefore NOT be counted as independent confirmations of each other?",
    instructions:
      "Look for blocks that quote the same document, report the same underlying datum, or describe the same event from the same vantage point. Name specific pairs or groups. Distinguish 'same document' from 'same underlying event' — both matter, but they are different claims.",
  },
  crux: {
    label: "Crux",
    desideratum: "Identify cruxes",
    question:
      "What is the single crux in this corpus — the specific factual or inferential disagreement that, if resolved, would most change the overall picture?",
    instructions:
      "A crux is not the loudest disagreement; it is the one with the most downstream leverage. Identify what specifically would have to be settled, and say what the picture looks like on each side of it.",
  },
  gap: {
    label: "Missing evidence",
    desideratum: "Surface what's missing",
    question:
      "What important source, perspective, or kind of evidence is MISSING from this corpus, such that its absence could distort the conclusion?",
    instructions:
      "Name what is absent and why its absence matters. Cite the blocks that reveal the gap by what they assume or leave unaddressed. Do not invent sources that exist; describe the shape of what is missing.",
  },
  rhetoric: {
    label: "Rhetoric vs evidence",
    desideratum: "Identify rhetorical moves that carry more persuasive weight than evidential weight",
    question:
      "Which claims in this corpus carry more persuasive weight than evidential weight — that is, which are doing rhetorical work disproportionate to what they actually establish?",
    instructions:
      "Look for confident framing on thin support, appeals to authority standing in for argument, and claims whose force comes from repetition rather than evidence. Be specific and cite the block.",
  },
  settled: {
    label: "Settled vs performed settling",
    desideratum: "Distinguish what the debate settled from what it merely performed settling",
    question:
      "Which questions in this corpus were actually settled by evidence, and which merely had the appearance of settlement — closed by authority, exhaustion, or rhetorical victory rather than by resolving the underlying uncertainty?",
    instructions:
      "A question is settled when the evidence that would distinguish the hypotheses was actually gathered and examined. It is performed as settled when a verdict was reached, repeated, and treated as closed without that step. Cite the blocks that show which happened.",
  },
};

/** Job names, for CLI usage strings and API validation messages. */
export const JOB_NAMES = Object.keys(ADJUDICATION_JOBS);
