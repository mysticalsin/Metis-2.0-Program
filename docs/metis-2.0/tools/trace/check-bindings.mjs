#!/usr/bin/env node
// Verifies docs/metis-2.0/HOST-BINDINGS.md against the public code repo (M2-0386).
//
//   node check-bindings.mjs --code-repo <path> [--ref origin/m2/integration]
//   node check-bindings.mjs --code-root <dir>          (plain checkout, no git)
//
// BOUND rows: module file, exported symbol and test file must exist, and the test must
// reference the symbol. UNBOUND rows: owner ticket must exist in the ledger, the planned
// module must not exist yet (otherwise flip the row to BOUND), and the row must be listed in
// FINAL-AUDIT.md once that file exists (M2-0183).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(here, "../..");

export const defaultPaths = (root = docsRoot) => ({
  table: path.join(root, "HOST-BINDINGS.md"),
  tickets: path.join(root, "ledger/tickets.json"),
  finalAudit: path.join(root, "FINAL-AUDIT.md"),
});

const ROW_ID_RE = /^HB-\d{2}[a-z]?$/;
const TICKET_RE = /^M2-\d{4}$/;
const STATUSES = new Set(["BOUND", "UNBOUND"]);
const cell = (raw) => raw.trim().replace(/^`|`$/g, "").trim();

export function parseBindings(markdown) {
  const rows = [];
  for (const line of markdown.split("\n")) {
    if (!/^\|\s*HB-/.test(line)) continue;
    const c = line.split("|").slice(1, -1).map(cell);
    const [id, responsibility, status, module, symbol, owner, test] = c;
    rows.push({ id, responsibility, status, module, symbol, owner, test, columns: c.length });
  }
  return rows;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function hasDeclaration(source, symbol) {
  const decl = new RegExp(
    `\\bexport\\s+(?:default\\s+)?(?:declare\\s+)?(?:async\\s+)?(?:function\\*?|class|const|let|interface|type|enum)\\s+${escapeRe(symbol)}\\b`,
  );
  return decl.test(source);
}

export function hasWord(source, word) {
  return new RegExp(`\\b${escapeRe(word)}\\b`).test(source);
}

export function makeReader({ codeRepo, ref, codeRoot }) {
  if (codeRoot) {
    return async (rel) => {
      const abs = path.join(codeRoot, rel);
      return existsSync(abs) ? readFile(abs, "utf8") : null;
    };
  }
  return async (rel) => {
    try {
      return execFileSync("git", ["-C", codeRepo, "show", `${ref}:${rel}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      return null;
    }
  };
}

export async function checkBindings({ rows, read, ticketIds, finalAudit }) {
  const errors = [];
  const unbound = [];
  if (rows.length === 0) errors.push("HOST-BINDINGS.md has no HB-* rows");
  const seen = new Set();
  for (const r of rows) {
    const at = `${r.id ?? "?"}`;
    if (r.columns !== 7) errors.push(`${at}: expected 7 columns, found ${r.columns}`);
    if (!ROW_ID_RE.test(r.id ?? "")) errors.push(`${at}: bad row id`);
    if (seen.has(r.id)) errors.push(`${at}: duplicate row id`);
    seen.add(r.id);
    if (!STATUSES.has(r.status)) errors.push(`${at}: status must be BOUND or UNBOUND, got "${r.status}"`);
    const owners = (r.owner ?? "").split(/[,\s]+/).filter(Boolean);
    if (owners.length === 0 || owners.some((o) => !TICKET_RE.test(o))) {
      errors.push(`${at}: owner must be one or more M2-NNNN ticket ids, got "${r.owner}"`);
    } else if (ticketIds) {
      for (const o of owners) if (!ticketIds.has(o)) errors.push(`${at}: owner ${o} is not in the ledger`);
    }
    if (!r.module || !r.test) {
      errors.push(`${at}: module and test paths are required`);
      continue;
    }
    const moduleSrc = await read(r.module);
    const testSrc = await read(r.test);
    if (r.status === "BOUND") {
      if (!r.symbol || r.symbol === "—") errors.push(`${at}: BOUND row needs a symbol`);
      if (moduleSrc === null) errors.push(`${at}: module file missing: ${r.module}`);
      else if (r.symbol && !hasDeclaration(moduleSrc, r.symbol)) {
        errors.push(`${at}: symbol ${r.symbol} not exported from ${r.module}`);
      }
      if (testSrc === null) errors.push(`${at}: test file missing: ${r.test}`);
      else if (r.symbol && !hasWord(testSrc, r.symbol)) {
        errors.push(`${at}: test ${r.test} does not reference ${r.symbol}`);
      }
    } else if (r.status === "UNBOUND") {
      unbound.push(r);
      if (moduleSrc !== null) {
        errors.push(`${at}: UNBOUND row but ${r.module} now exists; bind it (symbol + test) or correct the path`);
      }
      if (finalAudit !== null && finalAudit !== undefined && !finalAudit.includes(r.id)) {
        errors.push(`${at}: UNBOUND row is not listed in FINAL-AUDIT.md (M2-0183)`);
      }
    }
  }
  return { errors, unbound };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    if (!k?.startsWith("--") || argv[i + 1] === undefined) throw new Error(`bad argument: ${k}`);
    out[k.slice(2)] = argv[i + 1];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const codeRepo = args["code-repo"] ?? process.env.METIS_CODE_REPO;
  const codeRoot = args["code-root"];
  if (!codeRepo && !codeRoot) throw new Error("pass --code-repo <path> (or --code-root <dir>)");
  const ref = args.ref ?? "origin/m2/integration";
  const p = defaultPaths();
  const rows = parseBindings(await readFile(p.table, "utf8"));
  const tickets = JSON.parse(await readFile(p.tickets, "utf8"));
  const list = Array.isArray(tickets) ? tickets : (tickets.tickets ?? []);
  const ticketIds = new Set(list.map((t) => t.id));
  const finalAudit = existsSync(p.finalAudit) ? await readFile(p.finalAudit, "utf8") : null;
  const { errors, unbound } = await checkBindings({
    rows,
    read: makeReader({ codeRepo, ref, codeRoot }),
    ticketIds,
    finalAudit,
  });
  for (const r of unbound) console.log(`UNBOUND ${r.id} -> ${r.owner}: ${r.responsibility}`);
  if (finalAudit === null && unbound.length > 0) {
    console.log("NOTE: FINAL-AUDIT.md does not exist yet; UNBOUND rows are enforced once M2-0183 creates it.");
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`FAIL ${e}`);
    process.exit(1);
  }
  console.log(`OK ${rows.length} rows checked (${rows.length - unbound.length} BOUND, ${unbound.length} UNBOUND) against ${codeRoot ?? ref}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`FAIL ${e.message}`);
    process.exit(1);
  });
}
