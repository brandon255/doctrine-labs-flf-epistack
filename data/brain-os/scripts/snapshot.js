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

  // 1. Memory index
  const indexPath = join(SRC, "data/index/icm-index.json");
  if (existsSync(indexPath)) {
    copyFile(indexPath, join(DEST, "icm-index.json"));
    console.log("  ✓ copied icm-index.json");
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
