import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Project root is the parent of src/. Everything resolves from here with
// absolute paths so scheduled / background work never depends on cwd (fixes RT-12).
export const ROOT = resolve(here, "..");

export const PATHS = {
  root: ROOT,
  config: join(ROOT, "config", "core-os.config.json"),
  skillsDir: join(ROOT, "config", "skills"),
  agentsMd: join(ROOT, "config", "AGENTS.md"),
  learningPipelineSchema: join(ROOT, "config", "schemas", "learning_pipeline.schema.json"),
  coreOsSessionExample: join(ROOT, "config", "examples", "core_os_session.example.json"),
  coreOsSessionSchema: join(ROOT, "config", "schemas", "core_os_session.schema.json"),
  keyDir: join(ROOT, "config", ".keys"),
  masterKey: join(ROOT, "config", ".keys", "master.key"),
  telemetryKey: join(ROOT, "config", ".keys", "telemetry.key"),
  cartridgeSigningKey: join(ROOT, "config", ".keys", "cartridge_signing.key"),
  cartridgeSigningPub: join(ROOT, "config", "cartridge_signing.pub"),
  claudeMd: join(ROOT, "CLAUDE.md"),
  gitignore: join(ROOT, ".gitignore"),

  systemDir: join(ROOT, "SYSTEM"),
  contextMd: join(ROOT, "SYSTEM", "CONTEXT.md"),
  stagesDir: join(ROOT, "SYSTEM", "stages"),
  governanceDir: join(ROOT, "SYSTEM", "governance"),

  userDir: join(ROOT, "USER"),
  hot: join(ROOT, "USER", "active_hot_cache"),
  warm: join(ROOT, "USER", "warm_postmortems"),
  cold: join(ROOT, "USER", "cold_intelligence_management_center"),
  telemetry: join(ROOT, "USER", "cold_intelligence_management_center", "telemetry.csv"),
  ledger: join(ROOT, "USER", "cold_intelligence_management_center", "integrity-ledger.jsonl"),
  session: join(ROOT, "USER", "active_hot_cache", ".session.json"),
  operatorMemory: join(ROOT, "USER", "operator_memory.md"),
  canaries: join(ROOT, "USER", "cold_intelligence_management_center", "canaries.jsonl"),
  auditEvents: join(ROOT, "USER", "cold_intelligence_management_center", "audit-events.jsonl"),
  metricEvents: join(ROOT, "USER", "cold_intelligence_management_center", "metric-events.jsonl"),
  metricsDir: join(ROOT, "USER", "cold_intelligence_management_center", "metrics"),
  gmailOAuth: join(ROOT, "config", ".keys", "gmail.oauth.json"),
  proposals: join(ROOT, "USER", "active_hot_cache", ".proposals.json"),
  retrievalReceipts: join(ROOT, "USER", "retrieval_receipts"),

  secureVault: join(ROOT, "secure_vault"),
  extensionsDb: join(ROOT, "secure_vault", "db", "extensions.sqlite"),
  extensionsManifest: join(ROOT, "config", "extensions.manifest.json"),
  languageVendor: join(ROOT, "vendor"),
  languageData: join(ROOT, "secure_vault", "language"),

  careerOsCore: join(ROOT, "career_os_core"),
  careerOsDataStore: join(ROOT, "career_os_core", "data_store"),
  careerOs: join(ROOT, "career_os"),
  careerOsSourceTruth: join(ROOT, "career_os", "SOURCE_TRUTH"),
  careerOsState: join(ROOT, "career_os", "STATE"),
  careerOsMetrics: join(ROOT, "career_os", "METRICS"),
};

export function stageDir(slug) {
  return join(PATHS.stagesDir, slug);
}
