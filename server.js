#!/usr/bin/env node
/**
 * FLF Epistemic Stack — self-contained local server.
 *
 * Zero runtime dependencies. Uses node:http only. Binds to 127.0.0.1 (local-first,
 * never listens on a public address) on port 4318 (Core OS uses 4317; we sit beside it).
 *
 * Serves:
 *   - Static UI from web/ (landing, case view, about)
 *   - JSON API wrapping the epistemic engine
 *   - Endpoints reserved for local-LLM features (Phase 4): chat + alias proposer
 *
 * The router is exported (routeRequest) so the API can be tested without binding a port.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, normalize, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { runCaseStudy } from "./src/epistemic/ingest.js";
import { getLlmStatus } from "./src/epistemic/llm.js";
import { proposeAliases, acceptAlias } from "./src/epistemic/alias_proposer.js";
import { chatWithCase } from "./src/epistemic/evidence_chat.js";
import { adjudicate, recordHumanPosition } from "./src/epistemic/adjudicate.js";
import { ADJUDICATION_JOBS } from "./src/epistemic/jobs.js";
import {
  summarizeModelShelf,
  pickChallenger,
  resolveModelLineage,
} from "./src/epistemic/model_identity.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const WEB_DIR = join(ROOT, "web");
const CASES_DIR = join(ROOT, "docs", "epistemic");
// Human positions live beside the corpus, never inside it. Judging something and
// changing it stay separate acts.
const DECISIONS_DIR = join(ROOT, "decisions");
const PORT = Number(process.env.PORT) || 4318;
const HOST = "127.0.0.1";

const KNOWN_CASES = ["covid", "lhc", "eggs", "sample"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function json(status, payload) {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  };
}

async function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({ _raw: raw });
      }
    });
    req.on("error", () => resolve({}));
  });
}

/**
 * Pure-ish router. Exported for tests.
 * @param {{ method: string, pathname: string, search: URLSearchParams, body?: object }} req
 */
export async function routeRequest({ method, pathname, search, body = {} }) {
  // ---- Static UI ---------------------------------------------------------
  if (method === "GET" && (pathname === "/" || pathname === "")) {
    try {
      const html = await readFile(join(WEB_DIR, "index.html"), "utf8");
      return { status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: html };
    } catch (e) {
      return { status: 500, headers: { "content-type": "text/plain" }, body: `index.html missing: ${e.message}` };
    }
  }

  if (method === "GET" && (pathname === "/about" || pathname === "/about.html")) {
    try {
      const html = await readFile(join(WEB_DIR, "about.html"), "utf8");
      return { status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: html };
    } catch {
      return { status: 404, headers: { "content-type": "text/plain" }, body: "about.html missing" };
    }
  }

  if (method === "GET" && pathname === "/case.html") {
    try {
      const html = await readFile(join(WEB_DIR, "case.html"), "utf8");
      return { status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: html };
    } catch {
      return { status: 404, headers: { "content-type": "text/plain" }, body: "case.html missing" };
    }
  }

  if (method === "GET" && pathname.startsWith("/static/")) {
    // /static/foo.css → web/static/foo.css  (web/ is the UI root; static/ is a subdir of it)
    const rel = pathname.slice("/static/".length);
    const candidate = join(WEB_DIR, "static", rel);
    const safe = normalize(candidate);
    if (!safe.startsWith(join(WEB_DIR, "static"))) return json(400, { error: "bad path" });
    if (!existsSync(safe)) return json(404, { error: "not found" });
    const data = await readFile(safe);
    return {
      status: 200,
      headers: { "content-type": MIME[extname(safe).toLowerCase()] ?? "application/octet-stream" },
      body: data,
    };
  }

  // ---- JSON API ----------------------------------------------------------

  if (method === "GET" && pathname === "/api/ping") {
    return json(200, { ok: true, ts: Date.now(), service: "flf-epistack" });
  }

  if (method === "GET" && pathname === "/api/cases") {
    const cases = [];
    for (const id of KNOWN_CASES) {
      const dir = join(CASES_DIR, id);
      if (!existsSync(dir)) continue;
      try {
        const result = runCaseStudy(dir);
        cases.push({
          id,
          title: caseTitle(id),
          summary: result.summary,
          subquestion: readSubquestion(dir),
        });
      } catch (e) {
        cases.push({ id, title: caseTitle(id), error: e.message });
      }
    }
    return json(200, { ok: true, cases });
  }

  const caseMatch = pathname.match(/^\/api\/case\/([a-z0-9_-]+)$/);
  if (method === "GET" && caseMatch) {
    const id = caseMatch[1];
    if (!KNOWN_CASES.includes(id)) return json(404, { error: `unknown case: ${id}` });
    const dir = join(CASES_DIR, id);
    if (!existsSync(dir)) return json(404, { error: `case folder missing: ${id}` });
    try {
      const result = runCaseStudy(dir);
      const subquestion = readSubquestion(dir);
      return json(200, { ok: true, case: id, subquestion, ...result });
    } catch (e) {
      return json(500, { ok: false, error: e.message });
    }
  }

  if (method === "GET" && pathname === "/api/llm/status") {
    const status = await getLlmStatus();
    return json(200, { ok: true, ...status });
  }

  // The tool's own three-level counting, pointed at the model shelf on this
  // machine. Reports how much adjudication independence is actually available
  // here rather than how much we would like to claim.
  if (method === "GET" && pathname === "/api/llm/independence") {
    const status = await getLlmStatus();
    const installed = status?.models ?? [];
    const shelf = summarizeModelShelf(installed);
    const proposer = status?.model ?? installed[0] ?? null;
    const challenger = proposer ? pickChallenger(proposer, installed) : null;
    return json(200, {
      ok: true,
      ollama_reachable: Boolean(status?.ok),
      ...shelf,
      proposer,
      proposer_lineage: proposer ? resolveModelLineage(proposer).lineage_id : null,
      challenger,
      // Mechanical always runs, so a machine with no models still gets one
      // genuinely independent challenger — hence 'weak' rather than 'none'.
      available_grade: challenger ? "moderate" : "weak",
      unresolvable:
        "Level 4 — shared pretraining corpora across open models — is real and not " +
        "resolvable, because no major open model discloses its training data.",
    });
  }

  // ---- Phase 4: LLM endpoints (require Ollama) ---------------------------

  if (method === "POST" && pathname === "/api/aliases/propose") {
    const caseId = body?.case ?? search?.get("case");
    if (!caseId || !KNOWN_CASES.includes(caseId)) {
      return json(400, { error: "case required (one of: " + KNOWN_CASES.join(", ") + ")" });
    }
    const dir = join(CASES_DIR, caseId);
    try {
      const result = await proposeAliases(dir, body?.options ?? {});
      return json(200, { ok: true, case: caseId, proposals: result.proposals, model: result.model });
    } catch (e) {
      return json(503, { ok: false, error: e.message });
    }
  }

  if (method === "POST" && pathname === "/api/aliases/accept") {
    const caseId = body?.case;
    const proposal = body?.proposal;
    if (!caseId || !proposal) return json(400, { error: "case + proposal required" });
    if (!KNOWN_CASES.includes(caseId)) return json(404, { error: `unknown case: ${caseId}` });
    const dir = join(CASES_DIR, caseId);
    try {
      const result = acceptAlias(dir, proposal);
      return json(200, { ok: true, ...result });
    } catch (e) {
      return json(500, { ok: false, error: e.message });
    }
  }

  if (method === "POST" && pathname === "/api/adjudicate") {
    const caseId = body?.case;
    const job = String(body?.job ?? "").trim();
    if (!caseId || !KNOWN_CASES.includes(caseId)) {
      return json(400, { error: "case required (one of: " + KNOWN_CASES.join(", ") + ")" });
    }
    if (!ADJUDICATION_JOBS[job]) {
      return json(400, { error: "job required (one of: " + Object.keys(ADJUDICATION_JOBS).join(", ") + ")" });
    }
    const dir = join(CASES_DIR, caseId);
    try {
      const { blocks, claim_graph, measurement_roots } = runCaseStudy(dir);
      const spec = ADJUDICATION_JOBS[job];
      const record = await adjudicate({
        question: body?.question || spec.question,
        jobType: job,
        blocks,
        instructions: spec.instructions,
        // Mechanical check C4 needs the graph to spot counter-evidence the
        // reasoning walked past.
        edges: claim_graph?.edges ?? [],
        cwd: dir,
        // Declared in the case's source_registry.json, never in a request body:
        // an HTTP caller must not get to choose where a command runs.
        measurementRoots: measurement_roots ?? {},
        opts: body?.options ?? {},
      });
      return json(200, { ok: true, case: caseId, record });
    } catch (e) {
      return json(503, { ok: false, error: e.message });
    }
  }

  // Stage 4. The human is the only lineage on the panel that is not another
  // instance of the thing being checked, so recording their position is what
  // lifts independence to `strong`. It is never required — accept works without
  // it, at a lower grade, and the UI says so.
  if (method === "POST" && pathname === "/api/decision") {
    const caseId = body?.case;
    const job = String(body?.job ?? "").trim();
    const record = body?.record;
    const position = body?.position ?? {};
    if (!caseId || !KNOWN_CASES.includes(caseId)) {
      return json(400, { error: "case required (one of: " + KNOWN_CASES.join(", ") + ")" });
    }
    if (!ADJUDICATION_JOBS[job]) {
      return json(400, { error: "job required (one of: " + Object.keys(ADJUDICATION_JOBS).join(", ") + ")" });
    }
    if (!record || typeof record !== "object") {
      return json(400, { error: "record required" });
    }
    if (!["accepted", "rejected"].includes(position.decision)) {
      return json(400, { error: "position.decision must be 'accepted' or 'rejected'" });
    }

    try {
      const updated = recordHumanPosition(record, {
        ...position,
        answered_at: new Date().toISOString(),
      });

      // caseId and job are both validated against fixed allow-lists above, so
      // the filename cannot be steered outside this directory.
      if (!existsSync(DECISIONS_DIR)) mkdirSync(DECISIONS_DIR, { recursive: true });
      const file = join(DECISIONS_DIR, `${caseId}-${job}-${Date.now()}.json`);
      writeFileSync(
        file,
        JSON.stringify(
          {
            case: caseId,
            job,
            decision: updated.human_decision,
            verdict: updated.verdict,
            independence_grade: updated.challenge_panel?.independence_grade ?? null,
            conclusion: updated.conclusion ?? null,
            model: updated.model ?? null,
            human_position: updated.human_position,
            human_engaged: updated.human_engaged,
            recorded_at: new Date().toISOString(),
          },
          null,
          2
        ) + "\n",
        "utf8"
      );

      return json(200, {
        ok: true,
        record: updated,
        // Relative, so the UI can name the file without leaking a home directory.
        saved_to: `decisions/${basename(file)}`,
      });
    } catch (e) {
      return json(500, { ok: false, error: e.message });
    }
  }

  if (method === "POST" && pathname === "/api/chat") {
    const caseId = body?.case;
    const question = String(body?.question ?? "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    if (!caseId || !KNOWN_CASES.includes(caseId)) {
      return json(400, { error: "case required (one of: " + KNOWN_CASES.join(", ") + ")" });
    }
    if (!question) return json(400, { error: "question required" });
    const dir = join(CASES_DIR, caseId);
    try {
      const result = await chatWithCase(dir, question, history, body?.options ?? {});
      return json(200, { ok: true, case: caseId, ...result });
    } catch (e) {
      return json(503, { ok: false, error: e.message });
    }
  }

  return json(404, { error: `not found: ${method} ${pathname}` });
}

function caseTitle(id) {
  return {
    covid: "COVID-19 origins",
    lhc: "Could the LHC create a dangerous black hole?",
    eggs: "Are eggs bad for you?",
    sample: "Worked example (editable)",
  }[id] ?? id;
}

function readSubquestion(caseDir) {
  try {
    const p = join(caseDir, "SUBQUESTION.md");
    if (!existsSync(p)) return null;
    return readFileSync(p, "utf8").trim();
  } catch {
    return null;
  }
}

async function handle(req, res) {
  try {
    const url = new URL(req.url, `http://${HOST}`);
    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : {};
    const result = await routeRequest({
      method: req.method,
      pathname: url.pathname,
      search: url.searchParams,
      body,
    });
    res.writeHead(result.status, result.headers);
    res.end(result.body);
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
}

// ---- Boot (when run directly, not when imported for tests) --------------
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const server = createServer(handle);
  server.listen(PORT, HOST, () => {
    console.log(`FLF Epistemic Stack — local server`);
    console.log(`  http://${HOST}:${PORT}`);
    console.log(`  cases: ${KNOWN_CASES.join(", ")}`);
    console.log(`  Press Ctrl+C to stop.`);
  });
}
