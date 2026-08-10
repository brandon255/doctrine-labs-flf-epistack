#!/usr/bin/env node
// Brain OS snapshot into the FLF Epistack site.
//
// Mirrors:
//   - The Brain OS memory index (data/index/icm-index.json)
//   - The most recent daily report (reports/daily/YYYY-MM-DD.md)
//   - A subset of the per-IDE agent daily files (one most-recent per IDE)
//   - Today's status snapshot
//
// Destination: data/brain-os/ inside the FLF site.
//
// Privacy: this script must NEVER copy raw ChatGPT/Perplexity/Cursor
// exports — those live under sources/ in Brain OS and are gitignored.
// Only the post-ingest evidence blocks (which are typed summaries) flow
// through.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const SRC = join(ROOT, "..", "doctrine-labs-brain-os");
const DEST = join(ROOT, "data", "brain-os");

function copyFile(from, to) {
  try {
    writeFileSync(to, readFileSync(from, "utf8"));
    return true;
  } catch (e) {
    return false;
  }
}

// Patterns to scrub from any text content before writing to public snapshot.
const SCRUB_PATTERNS = [
  // Profanity (case-insensitive).
  [/\bfucking\b/gi, "[redacted]"],
  [/\bshit\b/gi, "[redacted]"],
  [/\bdamn\b/gi, "[redacted]"],
  [/\bbullshit\b/gi, "[redacted]"],
  [/\bbitch\b/gi, "[redacted]"],
  [/\bass\b/gi, "[redacted]"],
  // Recruiters / people.
  [/\bNaomi\s+H\.?/gi, "[recruiter]"],
  [/\bNaomi\b/gi, "[recruiter]"],
  [/\bJeremy\s+Kloth\b/gi, "[recruiter]"],
  [/\bBrandonMonicFlores\b/gi, "[user]"],
  [/\bBrandon\s+Flores\b/gi, "[user]"],
  // Domains / paths.
  [/doctrinalabs\.com/gi, "example.com"],
  [/\/Users\/[^\s)\]"]+/g, "[path]"],
  // People — soft bans.
  [/\bLynn\s+Brokaw\b/gi, "[private]"],
  [/\bLynn\b/gi, "[private]"],
  // Personal medical / hard bans.
  [/\bsobriety\b/gi, "[private]"],
  [/\bADHD\b/gi, "[private]"],
  [/\balcoholic\b/gi, "[private]"],
  [/\bAA meeting\b/gi, "[private]"],
  // Money-distress / private project names.
  [/\bI'?m broke\b/gi, "[private]"],
  [/\bbehind on rent\b/gi, "[private]"],
  [/\bcannot afford\b/gi, "[private]"],
  // Author tooling / project names.
  [/\bRivet\b/g, "[project]"],
  [/\brivet\b/g, "[project]"],
  [/\bWolf'?s\s+Garage\b/gi, "[project]"],
  [/\bWolf'?s?\b/gi, "[project]"],
  [/\bCursor\s+(IDE|chat|agent)\b/gi, "an editor"],
  // Hard-ban names from user rules.
  [/Who'?s\s+Who/gi, "[private]"],
  [/\blandlord\s+thread\b/gi, "[private]"],
  // "Competence-vent" / not-knowing patterns.
  [/I don'?t know shit/gi, "[redacted]"],
  [/I don'?t know how to use GitHub/gi, "[redacted]"],
  [/not knowing how to use GitHub/gi, "[redacted]"],
  [/did not yet know how to use GitHub/gi, "[redacted]"],
  [/GitHub learning moment/gi, "[redacted]"],
  [/asked how to save repos/gi, "[redacted]"],
];

function scrubText(text) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const [re, replacement] of SCRUB_PATTERNS) out = out.replace(re, replacement);
  return out;
}

function scrubClaimPreview(preview) {
  if (typeof preview !== "string") return preview;
  // Truncate aggressively + scrub profanity/names.
  let out = preview.slice(0, 60);
  return scrubText(out);
}

function scrubIcmIndex(raw) {
  // Scrub claim_preview fields in every block. Tags + source_ids stay
  // because they're already non-sensitive (e.g. perplexity:<uuid>).
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.blocks && typeof parsed.blocks === "object") {
      for (const id of Object.keys(parsed.blocks)) {
        const b = parsed.blocks[id];
        if (b && typeof b.claim_preview === "string") {
          b.claim_preview = scrubClaimPreview(b.claim_preview);
        }
      }
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

function copyIcmIndexSanitized(from, to) {
  try {
    const raw = readFileSync(from, "utf8");
    writeFileSync(to, scrubIcmIndex(raw));
    return true;
  } catch {
    return false;
  }
}

function listDaily(ideDir) {
  if (!existsSync(ideDir)) return [];
  return readdirSync(ideDir).filter((f) => f.endsWith(".md")).sort();
}

function main() {
  if (!existsSync(SRC)) {
    console.log(`Brain OS repo not found at ${SRC} — skipping snapshot.`);
    process.exit(0);
  }
  if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

  // 1. Memory index (sanitized — claim_preview fields are scrubbed of
  // profanity / personal names / paths before writing to public snapshot).
  const indexPath = join(SRC, "data/index/icm-index.json");
  if (existsSync(indexPath)) {
    copyIcmIndexSanitized(indexPath, join(DEST, "icm-index.json"));
    console.log("  ✓ copied icm-index.json (sanitized)");
  }

  // 2. Most recent daily report
  const dailyDir = join(SRC, "reports/daily");
  if (existsSync(dailyDir)) {
    const reports = readdirSync(dailyDir).filter((f) => f.endsWith(".md")).sort();
    if (reports.length > 0) {
      const latest = reports[reports.length - 1];
      copyFile(join(dailyDir, latest), join(DEST, `daily-${latest}`));
      console.log(`  ✓ copied daily report ${latest}`);
    }
  }

  // 3. Per-IDE agent latest daily file
  const agentsDir = join(SRC, "agents");
  const agentsOut = {};
  if (existsSync(agentsDir)) {
    for (const ide of readdirSync(agentsDir)) {
      const dailyDirIde = join(agentsDir, ide, "daily");
      const files = listDaily(dailyDirIde);
      if (files.length > 0) {
        const latest = files[files.length - 1];
        const content = readFileSync(join(dailyDirIde, latest), "utf8");
        agentsOut[ide] = { file: latest, content: content.slice(0, 4000) };
        console.log(`  ✓ captured ${ide} daily (${latest})`);
      }
    }
  }
  writeFileSync(join(DEST, "agents-snapshot.json"), JSON.stringify(agentsOut, null, 2));

  // 4. Topic summary (counts only, no claim text)
  const topics = [];
  const memoryDir = join(SRC, "data/memory");
  if (existsSync(memoryDir)) {
    for (const topic of readdirSync(memoryDir)) {
      const blocksPath = join(memoryDir, topic, "evidence_blocks.json");
      if (!existsSync(blocksPath)) continue;
      try {
        const raw = JSON.parse(readFileSync(blocksPath, "utf8"));
        const blocks = Array.isArray(raw) ? raw : (raw.blocks || []);
        const tagCounts = {};
        for (const b of blocks) for (const t of (b.tags || [])) tagCounts[t] = (tagCounts[t] || 0) + 1;
        const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        topics.push({
          topic,
          block_count: blocks.length,
          top_tags: Object.fromEntries(topTags),
        });
      } catch {}
    }
  }
  writeFileSync(join(DEST, "topics-snapshot.json"), JSON.stringify({ topics, generated_at: new Date().toISOString() }, null, 2));
  console.log(`  ✓ copied ${topics.length} topic summaries`);

  // 5. SNAPSHOT.json metadata
  const meta = {
    service: "brain-os",
    source: "doctrine-labs-brain-os",
    generated_at: new Date().toISOString(),
    files: ["icm-index.json", "agents-snapshot.json", "topics-snapshot.json"],
  };
  writeFileSync(join(DEST, "SNAPSHOT.json"), JSON.stringify(meta, null, 2));
  console.log("\n✓ Brain OS snapshot complete.");
}

main();
