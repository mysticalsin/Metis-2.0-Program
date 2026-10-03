#!/usr/bin/env node
// Guards HeyClicky claims and the reference register (M2-0261).
//
//   node check-reference-claims.mjs [file ...]     (default: the four registers listed in defaultFiles)
//
// Markdown: every table row (and every ADOPTION:/COMPARISON: line) that cites HeyClicky in an
// adoption, comparison or disposition record must carry the artifact version, build, sha256 and
// an evidence level. A record that cites the vendor changelog or release notes must be labelled
// VENDOR_CLAIM, so a vendor feature is never presented as installed behaviour.
// JSON: the file needs a top-level artifact block with the same four fields, every capability and
// parity row needs an evidence level, and a row that cites a changelog needs the VENDOR_CLAIM label.
// REFERENCE-REGISTER.md must have a complete row for every R and REF row of ID-INVENTORY.json,
// and complete owner-supplied rows outside that inventory namespace.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EVIDENCE_LEVELS = ["STATIC_INSPECTION", "DOCUMENTED", "VERIFIED_LOCALLY", "VENDOR_CLAIM", "UNKNOWN"];
export const VENDOR_CLAIM = "VENDOR_CLAIM";
export const REGISTER_KINDS = ["REFERENCE", "INPUT", "OWN_SOURCE"];

const CLICKY_RE = /clicky/i;
const RECORD_RE = /\b(?:adopt\w*|adapt\w*|reject\w*|parity|compar\w*|disposition\w*)\b/i;
const CHANGELOG_RE = /changelog|release notes/i;
const VERSION_RE = /\b\d+\.\d+\.\d+\b/;
const BUILD_RE = /\bbuild\s+\d+\b/i;
const SHA256_RE = /\b[0-9a-f]{64}\b/;
const LEVEL_RE = new RegExp(`\\b(?:${EVIDENCE_LEVELS.join("|")})\\b`);
const MARKED_LINE_RE = /^\s*(?:[-*]\s*)?(?:ADOPTION|COMPARISON):/;
const DECISION_RE = /^(?:adopt|adapt|reject)\b/i;
const INVENTORY_REGISTER_KEY_RE = /^[^:\s]+:(?:R\d{2}|REF-\d{2})$/;
const OWNER_REGISTER_KEY_RE = /^owner:OREF-\d{2}$/;

const here = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(here, "../..");

export const defaultFiles = (root = docsRoot) => [
  path.join(root, "baseline/SOURCE-REGISTER.md"),
  path.join(root, "baseline/REFERENCE-REGISTER.md"),
  path.join(root, "kit/PORT-DECISIONS.md"),
  path.join(root, "kit/CAPABILITY-DISPOSITIONS.json"),
];

function missingPinFields(text) {
  const missing = [];
  if (!VERSION_RE.test(text)) missing.push("version");
  if (!BUILD_RE.test(text)) missing.push("build");
  if (!SHA256_RE.test(text)) missing.push("sha256");
  if (!LEVEL_RE.test(text)) missing.push("evidence level");
  return missing;
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

const isSeparator = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

// Returns one message per violation, prefixed with file:line.
export function checkMarkdown(text, file = "input.md") {
  const errors = [];
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const isRow = line.trimStart().startsWith("|") && !isSeparator(line) && !isSeparator(lines[index + 1] ?? "");
    if (!isRow && !MARKED_LINE_RE.test(line)) continue;
    if (!CLICKY_RE.test(line)) continue;
    const cites = RECORD_RE.test(line) || CHANGELOG_RE.test(line) || MARKED_LINE_RE.test(line);
    if (!cites) continue;
    const where = `${file}:${index + 1}`;
    const missing = missingPinFields(line);
    if (missing.length > 0) errors.push(`${where}: HeyClicky record lacks ${missing.join(", ")}`);
    if (CHANGELOG_RE.test(line) && !line.includes(VENDOR_CLAIM)) {
      errors.push(`${where}: vendor changelog claim is not labelled ${VENDOR_CLAIM}, so it reads as installed behaviour`);
    }
  }
  return errors;
}

function ownStrings(object) {
  return Object.values(object).filter((value) => typeof value === "string");
}

export function checkJson(text, file = "input.json") {
  const errors = [];
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (error) {
    return [`${file}: invalid JSON: ${error.message}`];
  }

  if (CLICKY_RE.test(text)) {
    const artifact = doc.artifact ?? {};
    const missing = ["version", "build", "sha256", "evidence_level"].filter(
      (field) => typeof artifact[field] !== "string" || artifact[field].trim() === "",
    );
    if (missing.length > 0) errors.push(`${file}: artifact block lacks ${missing.join(", ")}`);
    else if (!SHA256_RE.test(artifact.sha256)) errors.push(`${file}: artifact sha256 is not 64 lowercase hex characters`);
    else if (!EVIDENCE_LEVELS.includes(artifact.evidence_level)) {
      errors.push(`${file}: artifact evidence_level ${artifact.evidence_level} is not one of ${EVIDENCE_LEVELS.join(", ")}`);
    }
  }

  for (const key of ["capabilities", "parity"]) {
    for (const [index, row] of (Array.isArray(doc[key]) ? doc[key] : []).entries()) {
      const where = `${file}: ${key}[${index}] ${row.id ?? ""}`.trim();
      if (!EVIDENCE_LEVELS.includes(row.evidence_level)) {
        errors.push(`${where}: evidence_level must be one of ${EVIDENCE_LEVELS.join(", ")}`);
      }
      if (row.label === "verified locally" && row.evidence_level !== "VERIFIED_LOCALLY") {
        errors.push(`${where}: label "verified locally" needs evidence_level VERIFIED_LOCALLY`);
      }
      const strings = ownStrings(row);
      if (strings.some((value) => CHANGELOG_RE.test(value)) && !strings.some((value) => value.includes(VENDOR_CLAIM))) {
        errors.push(`${where}: vendor changelog claim is not labelled ${VENDOR_CLAIM}`);
      }
    }
  }
  return errors;
}

// Key format is kit:id (the traceability rowKey), for example r11:R25. The long HeyClicky kit
// name is shortened to hc-kit so that only rows that really cite HeyClicky trip the record check.
const KIT_ALIASES = { "Metis-HeyClicky-Interaction-Upgrade": "hc-kit" };
export const registerKey = (row) => `${KIT_ALIASES[row.kit] ?? row.kit}:${row.id}`;

export function checkReferenceRegister(text, inventoryRows, file = "REFERENCE-REGISTER.md") {
  const errors = [];
  const rows = new Map();
  const ownerRows = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trimStart().startsWith("|") || isSeparator(line)) continue;
    const cells = tableCells(line);
    const key = cells[0] ?? "";
    if (INVENTORY_REGISTER_KEY_RE.test(key)) rows.set(key, { cells, line: index + 1 });
    else if (OWNER_REGISTER_KEY_RE.test(key)) ownerRows.set(key, { cells, line: index + 1 });
  }
  const wanted = inventoryRows
    .filter((row) => row.family === "R" || row.family === "REF")
    .map(registerKey);
  for (const key of wanted) {
    const row = rows.get(key);
    if (!row) {
      errors.push(`${file}: no register row for ${key}`);
      continue;
    }
    const [, reference, kind, pin, licence, security, decision, label] = row.cells;
    const where = `${file}:${row.line} ${key}`;
    if (row.cells.length !== 8) errors.push(`${where}: expected 8 columns, found ${row.cells.length}`);
    for (const [name, value] of Object.entries({ reference, pin, licence, security, label })) {
      if (!value) errors.push(`${where}: empty ${name}`);
    }
    if (!REGISTER_KINDS.includes(kind)) errors.push(`${where}: kind must be one of ${REGISTER_KINDS.join(", ")}`);
    if (!DECISION_RE.test(decision ?? "")) errors.push(`${where}: decision must start with adopt, adapt or reject`);
  }
  const wantedSet = new Set(wanted);
  for (const key of rows.keys()) {
    if (!wantedSet.has(key)) errors.push(`${file}: register row ${key} is not in ID-INVENTORY.json`);
  }
  for (const [key, row] of ownerRows) {
    validateRegisterRow(key, row, errors, file);
  }
  return errors;
}

function validateRegisterRow(key, row, errors, file) {
  const [, reference, kind, pin, licence, security, decision, label] = row.cells;
  const where = `${file}:${row.line} ${key}`;
  if (row.cells.length !== 8) errors.push(`${where}: expected 8 columns, found ${row.cells.length}`);
  for (const [name, value] of Object.entries({ reference, pin, licence, security, label })) {
    if (!value) errors.push(`${where}: empty ${name}`);
  }
  if (!REGISTER_KINDS.includes(kind)) errors.push(`${where}: kind must be one of ${REGISTER_KINDS.join(", ")}`);
  if (!DECISION_RE.test(decision ?? "")) errors.push(`${where}: decision must start with adopt, adapt or reject`);
}

// The parity table in PORT-DECISIONS.md is a rendering of CAPABILITY-DISPOSITIONS.json: same ids, same labels.
export function checkParityTable(text, dispositions, file = "PORT-DECISIONS.md") {
  const errors = [];
  const shown = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const cells = tableCells(line);
    if (!line.trimStart().startsWith("|") || !/^CXCAP-\d{2}$/.test(cells[0] ?? "")) continue;
    shown.set(cells[0], { label: cells[2], line: index + 1 });
  }
  for (const entry of dispositions.parity ?? []) {
    const row = shown.get(entry.id);
    if (!row) errors.push(`${file}: parity table has no row for ${entry.id}`);
    else if (row.label !== entry.label) {
      errors.push(`${file}:${row.line} ${entry.id} is labelled "${row.label}" but the JSON says "${entry.label}"`);
    }
  }
  return errors;
}

export async function checkFiles(files, { root = docsRoot } = {}) {
  const errors = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const shown = path.relative(root, file);
    if (file.endsWith(".json")) errors.push(...checkJson(text, shown));
    else errors.push(...checkMarkdown(text, shown));
    if (path.basename(file) === "REFERENCE-REGISTER.md") {
      const inventory = JSON.parse(await readFile(path.join(root, "kit/ID-INVENTORY.json"), "utf8"));
      errors.push(...checkReferenceRegister(text, inventory.rows, shown));
    }
    if (path.basename(file) === "PORT-DECISIONS.md") {
      const dispositions = JSON.parse(await readFile(path.join(root, "kit/CAPABILITY-DISPOSITIONS.json"), "utf8"));
      errors.push(...checkParityTable(text, dispositions, shown));
    }
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args.map((file) => path.resolve(file)) : defaultFiles();
  const errors = await checkFiles(files);
  if (errors.length > 0) {
    for (const error of errors) console.error(`reference-claims: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`reference-claims: ok (${files.length} files)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
