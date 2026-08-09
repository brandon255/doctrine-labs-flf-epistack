/**
 * Tests for the user-facing /api/analyze endpoint + parsers.
 *
 * Covers:
 *   - parsers/json.js  — accept array, accept {blocks:[]}, validate, hydrate
 *   - parsers/markdown.js — bullet lists, citation blocks, label detection
 *   - parsers/pdf.js — buffer dispatch, scanned-PDF error
 *   - server.js /api/analyze — JSON path, format auto-detection, error surface
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseJsonEvidence } from "../parsers/json.js";
import { parseMarkdownEvidence } from "../parsers/markdown.js";
import { parsePdfEvidence } from "../parsers/pdf.js";
import { routeRequest } from "../server.js";

// ---------------- parsers/json.js ----------------

test("parsers/json: bare array", () => {
  const r = parseJsonEvidence(JSON.stringify([
    { claim: "A", source: { type: "document", identifier: "x" } },
    { claim: "B", source: { type: "document", identifier: "x" } },
  ]));
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 2);
});

test("parsers/json: { blocks: [...] } wrapper", () => {
  const r = parseJsonEvidence(JSON.stringify({ blocks: [{ claim: "A" }] }));
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 1);
});

test("parsers/json: { evidence_blocks: [...] } alternate wrapper", () => {
  const r = parseJsonEvidence(JSON.stringify({ evidence_blocks: [{ claim: "A" }] }));
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 1);
});

test("parsers/json: invalid JSON returns ok:false with hint", () => {
  const r = parseJsonEvidence("{ not json");
  assert.equal(r.ok, false);
  assert.match(r.error, /invalid JSON/i);
  assert.ok(r.hint);
});

test("parsers/json: empty array returns ok:false", () => {
  const r = parseJsonEvidence("[]");
  assert.equal(r.ok, false);
  assert.match(r.error, /empty/i);
});

test("parsers/json: missing claim returns precise error", () => {
  const r = parseJsonEvidence(JSON.stringify([{ source: { identifier: "x" } }]));
  assert.equal(r.ok, false);
  assert.match(r.error, /missing required field "claim"/);
});

test("parsers/json: hydrates missing source from provenance URL", () => {
  const r = parseJsonEvidence(JSON.stringify([
    { claim: "A", provenance: { context: "https://nytimes.com/article" } },
  ]));
  assert.equal(r.ok, true);
  assert.equal(r.blocks[0].source.identifier, "nytimes.com");
});

test("parsers/json: normalizes provenance.context object to string", () => {
  const r = parseJsonEvidence(JSON.stringify([
    { claim: "A", provenance: { context: { url: "https://example.com/x" } } },
  ]));
  assert.equal(r.ok, true);
  assert.equal(typeof r.blocks[0].provenance.context, "string");
  assert.match(r.blocks[0].provenance.context, /example\.com/);
});

// ---------------- parsers/markdown.js ----------------

test("parsers/markdown: simple bullet list with URLs", () => {
  const md = `- First claim https://example.com/one
- Second claim https://other.com/two
- Third claim, shares source https://example.com/one`;
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 3);
  // Two unique hosts (example.com + other.com) → two distinct lineages
  const hosts = new Set(r.blocks.map((b) => b.source.identifier));
  assert.equal(hosts.size, 2);
});

test("parsers/markdown: confidence label [HIGH]/[MEDIUM]/[LOW]", () => {
  const md = `- [HIGH] One
- [MEDIUM] Two
- [LOW] Three`;
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.deepEqual(r.blocks.map((b) => b.confidence_label), ["HIGH", "MEDIUM", "LOW"]);
});

test("parsers/markdown: **HIGH** style label", () => {
  const md = "- **HIGH** Strong claim";
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.equal(r.blocks[0].confidence_label, "HIGH");
});

test("parsers/markdown: blockquote with Source line", () => {
  const md = `> The verbatim quote from the document.
> Source: https://example.com/doc`;
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 1);
  assert.match(r.blocks[0].source.identifier, /example\.com/);
});

test("parsers/markdown: bullet with markdown link", () => {
  const md = "- A claim with [named source](https://wired.com/article)";
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 1);
  assert.equal(r.blocks[0].source.identifier, "wired.com");
});

test("parsers/markdown: empty input returns ok:false", () => {
  const r = parseMarkdownEvidence("");
  assert.equal(r.ok, false);
  assert.match(r.error, /empty/i);
});

test("parsers/markdown: skips headings", () => {
  const md = `# Big heading
## Subheading
- Real claim https://example.com/x`;
  const r = parseMarkdownEvidence(md);
  assert.equal(r.ok, true);
  assert.equal(r.blocks.length, 1);
});

// ---------------- parsers/pdf.js ----------------

test("parsers/pdf: empty buffer returns ok:false", async () => {
  const r = await parsePdfEvidence(Buffer.alloc(0), "empty.pdf");
  assert.equal(r.ok, false);
});

test("parsers/pdf: invalid bytes return ok:false with hint", async () => {
  const r = await parsePdfEvidence(Buffer.from("not a pdf"), "fake.pdf");
  assert.equal(r.ok, false);
  assert.ok(r.hint);
});

// ---------------- server /api/analyze ----------------

test("server: /api/analyze JSON path — 3 blocks, 2 share URL → 1.5x inflation", async () => {
  const body = JSON.stringify({
    text: JSON.stringify([
      { claim: "A", provenance: { context: "https://example.com/x" } },
      { claim: "B", provenance: { context: "https://example.com/x" } },
      { claim: "C", provenance: { context: "https://other.com/y" } },
    ]),
  });
  const result = await routeRequest({
    method: "POST",
    pathname: "/api/analyze",
    search: new URLSearchParams(),
    body: { text: JSON.parse(body).text },
  });
  assert.equal(result.status, 200);
  const payload = JSON.parse(result.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.block_count, 3);
  assert.equal(payload.summary.document_count, 2);
  assert.equal(payload.summary.lineage_count, 2);
  assert.equal(payload.summary.inflation_factor, 1.5);
});

test("server: /api/analyze Markdown path", async () => {
  const result = await routeRequest({
    method: "POST",
    pathname: "/api/analyze",
    search: new URLSearchParams(),
    body: {
      text: "- First https://example.com/a\n- Second https://example.com/a\n- Third https://other.com/b",
    },
  });
  assert.equal(result.status, 200);
  const payload = JSON.parse(result.body);
  assert.equal(payload.source, "md");
  assert.equal(payload.summary.document_count, 2);
});

test("server: /api/analyze auto-detects format from raw text", async () => {
  // User pastes JSON without wrapping { text: ... }
  const jsonText = '[{"claim":"x","provenance":{"context":"https://a.com/y"}}]';
  const result = await routeRequest({
    method: "POST",
    pathname: "/api/analyze",
    search: new URLSearchParams(),
    body: { _raw: jsonText },
  });
  assert.equal(result.status, 200);
  const payload = JSON.parse(result.body);
  assert.equal(payload.source, "json");
});

test("server: /api/analyze rejects malformed JSON with hint", async () => {
  const result = await routeRequest({
    method: "POST",
    pathname: "/api/analyze",
    search: new URLSearchParams(),
    body: { text: "{ not json }" },
  });
  assert.equal(result.status, 400);
  const payload = JSON.parse(result.body);
  assert.equal(payload.ok, false);
  assert.match(payload.error, /invalid JSON/i);
});

test("server: /api/analyze rejects empty body", async () => {
  const result = await routeRequest({
    method: "POST",
    pathname: "/api/analyze",
    search: new URLSearchParams(),
    body: {},
  });
  assert.equal(result.status, 400);
});