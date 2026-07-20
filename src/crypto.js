import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  timingSafeEqual,
  generateKeyPairSync,
  sign as edSign,
  verify as edVerify,
} from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { PATHS } from "./paths.js";

// Fixes RT-03 ("encrypted" cold storage was only gzip) with real AES-256-GCM,
// and RT-13 (chattr/sudo) by needing no root and no Linux-specific syscall.
const ALGO = "aes-256-gcm";

function ensureKey(path) {
  if (!existsSync(PATHS.keyDir)) mkdirSync(PATHS.keyDir, { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(path, randomBytes(32));
    // chmod is a no-op on Windows but tightens perms on posix. Best-effort.
    try {
      chmodSync(path, 0o600);
    } catch {
      /* ignore on platforms that don't support it */
    }
  }
  const key = readFileSync(path);
  if (key.length !== 32) {
    throw new Error(`Key at ${path} is ${key.length} bytes; expected 32.`);
  }
  return key;
}

/** Master key for encrypting cold archives / vault payloads. */
export function getMasterKey() {
  if (process.env.CORE_OS_KEY) {
    const k = Buffer.from(process.env.CORE_OS_KEY, "base64");
    if (k.length === 32) return k;
  }
  return ensureKey(PATHS.masterKey);
}

/** Separate key for HMAC pseudonymization of identifiers (fixes RT-09). */
export function getTelemetryKey() {
  if (process.env.CORE_OS_TELEMETRY_KEY) {
    const k = Buffer.from(process.env.CORE_OS_TELEMETRY_KEY, "base64");
    if (k.length === 32) return k;
  }
  return ensureKey(PATHS.telemetryKey);
}

/** Encrypt a UTF-8 string. Output: base64(iv | authTag | ciphertext). */
export function encrypt(plaintext, key = getMasterKey()) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt the base64 produced by encrypt(). Throws on tamper (GCM auth fail). */
export function decrypt(payloadB64, key = getMasterKey()) {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** SHA-256 hex of a string. Used for tamper-evident hashing (fixes RT-15). */
export function sha256(str) {
  return createHash("sha256").update(str, "utf8").digest("hex");
}

/** HMAC-SHA256 hex - deterministic pseudonym for an id (fixes RT-09 plaintext user_id). */
export function pseudonymize(value, key = getTelemetryKey()) {
  return createHmac("sha256", key).update(String(value), "utf8").digest("hex").slice(0, 32);
}

// --- Cartridge signing (fixes the supply-chain gap: verify-before-mount) ---
// ed25519: the PRIVATE key signs a cartridge manifest; the PUBLIC key (safe to
// commit) verifies it. Without the private key a manifest cannot be forged.

export function getCartridgeSigningKeys() {
  if (!existsSync(PATHS.keyDir)) mkdirSync(PATHS.keyDir, { recursive: true });
  if (!existsSync(PATHS.cartridgeSigningKey) || !existsSync(PATHS.cartridgeSigningPub)) {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    writeFileSync(PATHS.cartridgeSigningKey, privateKey.export({ type: "pkcs8", format: "pem" }));
    writeFileSync(PATHS.cartridgeSigningPub, publicKey.export({ type: "spki", format: "pem" }));
    try {
      chmodSync(PATHS.cartridgeSigningKey, 0o600);
    } catch {
      /* no-op on platforms without posix perms */
    }
  }
  return {
    privateKeyPem: readFileSync(PATHS.cartridgeSigningKey, "utf8"),
    publicKeyPem: readFileSync(PATHS.cartridgeSigningPub, "utf8"),
  };
}

// Recursively key-sorted JSON. The replacer-array form of JSON.stringify only
// keeps listed keys at EVERY level, which silently drops nested objects - so we
// serialize by hand to guarantee every field is covered by the signature.
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
    .join(",")}}`;
}

/** Sign a manifest object. Returns base64 signature. */
export function signManifest(manifest, privateKeyPem = getCartridgeSigningKeys().privateKeyPem) {
  return edSign(null, Buffer.from(canonical(manifest), "utf8"), privateKeyPem).toString("base64");
}

/** Verify a manifest against a base64 signature. Returns boolean. */
export function verifyManifest(manifest, signatureB64, publicKeyPem = getCartridgeSigningKeys().publicKeyPem) {
  try {
    return edVerify(
      null,
      Buffer.from(canonical(manifest), "utf8"),
      publicKeyPem,
      Buffer.from(signatureB64, "base64"),
    );
  } catch {
    return false;
  }
}

/** Constant-time string compare for any future token checks. */
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
