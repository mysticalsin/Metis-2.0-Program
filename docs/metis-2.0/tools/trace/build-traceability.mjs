#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROGRAM_TICKET_RE = /^M2-\d{4}$/;
const KIT_REQUIREMENT_RE = /^M2-[A-Z][A-Z0-9]*-\d{2}$/;
const DECISION_RE = /^D-\d+$/;
const OUTPUT_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ENGINEERING_COMPLETE",
  "BLOCKED_EXTERNAL",
  "DONE",
];
const OUTPUT_RANK = new Map(OUTPUT_STATUSES.map((status, index) => [status, index]));
const EVIDENCE_STATUS_TO_OUTPUT = {
  MET: "DONE",
  PARTIAL: "ENGINEERING_COMPLETE",
  DEFERRED: "ENGINEERING_COMPLETE",
  BLOCKED: "BLOCKED_EXTERNAL",
  NOT_MET: "NOT_STARTED",
};
const TICKET_STATUS_TO_OUTPUT = {
  TODO: "NOT_STARTED",
  CANCELLED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  ENGINEERING_COMPLETE: "ENGINEERING_COMPLETE",
  DEFERRED: "ENGINEERING_COMPLETE",
  BLOCKED_EXTERNAL: "BLOCKED_EXTERNAL",
  DONE: "DONE",
};

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(here, "../..");

export const defaultPaths = (root = defaultRoot) => ({
  root,
  inventory: path.join(root, "kit/ID-INVENTORY.json"),
  legacyTraceJson: path.join(root, "TRACEABILITY.json"),
  tickets: path.join(root, "ledger/tickets.json"),
  evidenceRecords: path.join(root, "evidence/records"),
  decisions: path.join(root, "DECISIONS.md"),
  blockers: path.join(root, "BLOCKERS.md"),
  outputMarkdown: path.join(root, "TRACEABILITY.md"),
  outputJson: path.join(root, "ledger/traceability.json"),
});

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function stableStringify(value) {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys(value[key])]),
  );
}

export function seedInventoryFromTraceability(traceability) {
  assert(Array.isArray(traceability.rows), "TRACEABILITY.json must contain rows");
  return {
    source: "docs/metis-2.0/TRACEABILITY.json rows",
    rows: traceability.rows.map((row) => ({
      id: row.id,
      family: row.family,
      title: row.title ?? "",
      kit: row.kit,
      source_file: row.source_file,
      source_ref: row.source_ref,
      parent_task: row.parent_task ?? "",
      sources: Array.isArray(row.sources) ? row.sources : [],
    })),
  };
}

export async function loadInventory(paths) {
  try {
    return await readJson(paths.inventory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return seedInventoryFromTraceability(await readJson(paths.legacyTraceJson));
  }
}

export async function loadEvidenceRecords(recordsDir) {
  let names = [];
  try {
    names = await readdir(recordsDir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const records = [];
  for (const name of names.sort()) {
    if (!name.endsWith(".jsonl")) continue;
    const file = path.join(recordsDir, name);
    const text = await readFile(file, "utf8");
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      records.push({ ...record, _record_file: file, _record_line: index + 1 });
    }
  }
  return records;
}

// IDs that must exist in the inventory and be named in the acceptance of a mapped ticket.
export const REQUIRED_ACCEPTANCE_IDS = Array.from({ length: 6 }, (_, index) => `HM-FLOW-${String(index + 1).padStart(2, "0")}`);

export function computeTraceability({
  inventory,
  ledger,
  evidenceRecords = [],
  decisionsText = "",
  blockersText = "",
  requiredAcceptanceIds = [],
}) {
  const errors = [];
  const warnings = [];
  const rows = inventory.rows ?? inventory;
  assert(Array.isArray(rows), "inventory must be an array or contain rows");
  assert(Array.isArray(ledger.tickets), "ledger.tickets must be an array");

  const ticketsById = new Map(ledger.tickets.map((ticket) => [ticket.id, ticket]));
  const ticketIds = new Set(ticketsById.keys());
  const decisionIds = extractDecisionIds(decisionsText);
  const blockerTicketIds = extractBlockerTicketIds(blockersText);
  const inventoryIndex = buildInventoryIndex(rows, errors);
  const byRef = buildReferenceIndex(ledger.tickets, inventoryIndex, errors);
  const evidenceByTicket = groupEvidence(evidenceRecords, errors);

  for (const ticket of ledger.tickets) {
    validateTicketReferences(ticket, { ticketIds, decisionIds, errors });
  }
  validateBlockers(blockerTicketIds, ticketIds, errors);

  const outputRows = rows.map((row, index) => {
    validateInventoryRow(row, index, errors);
    const key = rowKey(row);
    const mappedTickets = byRef.get(key) ?? [];
    if (mappedTickets.length === 0) {
      errors.push(`unmapped inventory row ${key}`);
    }
    const ticketSummaries = mappedTickets
      .map((ticket) => ticketSummary(ticket, row, evidenceByTicket.get(ticket.id) ?? []))
      .sort((a, b) => a.id.localeCompare(b.id));
    const status = combineStatuses(ticketSummaries.map((ticket) => ticket.status));
    return {
      id: row.id,
      family: row.family,
      title: row.title ?? "",
      kit: row.kit,
      source_file: row.source_file,
      source_ref: row.source_ref,
      parent_task: row.parent_task ?? "",
      sources: Array.isArray(row.sources) ? row.sources : [],
      tickets: ticketSummaries,
      status,
    };
  });

  for (const id of requiredAcceptanceIds) {
    const idRows = outputRows.filter((row) => row.id === id);
    if (idRows.length === 0) {
      errors.push(`required inventory id ${id} is missing`);
      continue;
    }
    const named = idRows.some((row) =>
      row.tickets.some((summary) => (ticketsById.get(summary.id).acceptance ?? []).some((line) => line.includes(id))),
    );
    if (!named) errors.push(`required inventory id ${id} is not named in the acceptance of any mapped ticket`);
  }

  const duplicateRefs = findDuplicateRefRows(outputRows);
  const duplicatedRefIds = new Set(duplicateRefs.map((row) => row.id));
  if (outputRows.length >= 900 && duplicatedRefIds.size !== 16) {
    errors.push(`expected 16 duplicated REF-* ids across HeyClicky/v6, found ${duplicatedRefIds.size}`);
  }
  for (const row of duplicateRefs) {
    if (!["Metis-HeyClicky-Interaction-Upgrade", "v6"].includes(row.kit)) {
      errors.push(`duplicated ${row.id} has unexpected kit ${row.kit}`);
    }
  }

  const families = summarizeBy(outputRows, "family");
  const kits = summarizeBy(outputRows, "kit");
  const counts = {
    rows: outputRows.length,
    rows_mapped: outputRows.filter((row) => row.tickets.length > 0).length,
    unique_ids: new Set(outputRows.map((row) => row.id)).size,
    unique_ids_mapped: new Set(outputRows.filter((row) => row.tickets.length > 0).map((row) => row.id)).size,
    families: families.length,
  };

  return {
    errors,
    warnings,
    matrix: {
      schema_version: 1,
      sources: {
        inventory: "docs/metis-2.0/kit/ID-INVENTORY.json",
        ledger: "docs/metis-2.0/ledger/tickets.json",
        evidence_records: "docs/metis-2.0/evidence/records/*.jsonl",
        decisions: "docs/metis-2.0/DECISIONS.md",
        blockers: "docs/metis-2.0/BLOCKERS.md",
      },
      rules: {
        program_ticket: "M2-\\d{4}",
        kit_requirement: "M2-[A-Z][A-Z0-9]*-\\d{2}",
        status: OUTPUT_STATUSES,
        duplicated_ref_namespaces: ["Metis-HeyClicky-Interaction-Upgrade", "v6"],
      },
      counts,
      families,
      kits,
      rows: outputRows.sort((a, b) => rowKey(a).localeCompare(rowKey(b))),
    },
  };
}

function validateInventoryRow(row, index, errors) {
  for (const field of ["id", "family", "kit", "source_file", "source_ref"]) {
    if (typeof row[field] !== "string") errors.push(`inventory row ${index} missing string ${field}`);
  }
}

function buildInventoryIndex(rows, errors) {
  const keys = new Set();
  const rowsById = new Map();
  for (const [index, row] of rows.entries()) {
    validateInventoryRow(row, index, errors);
    const key = rowKey(row);
    if (keys.has(key)) errors.push(`duplicate inventory key ${key}`);
    keys.add(key);
    if (!rowsById.has(row.id)) rowsById.set(row.id, []);
    rowsById.get(row.id).push(row);
  }
  return { keys, rowsById };
}

function buildReferenceIndex(tickets, inventoryIndex, errors) {
  const byRef = new Map();
  for (const ticket of tickets) {
    if (!PROGRAM_TICKET_RE.test(ticket.id)) errors.push(`ticket id ${ticket.id} does not match M2-\\d{4}`);
    for (const ref of ticket.kit_refs ?? []) {
      if (ref === "M2-" || ref.startsWith("M2-") && !KIT_REQUIREMENT_RE.test(ref)) {
        errors.push(`ticket ${ticket.id} has invalid M2 kit ref ${ref}`);
      }
      for (const key of resolveReferenceKeys(ticket, ref, inventoryIndex, errors)) {
        addReference(byRef, key, ticket);
      }
    }
  }
  return byRef;
}

function resolveReferenceKeys(ticket, ref, inventoryIndex, errors) {
  if (inventoryIndex.keys.has(ref)) return [ref];

  const rows = inventoryIndex.rowsById.get(ref) ?? [];
  if (rows.length === 0) {
    errors.push(`ticket ${ticket.id} has dangling kit_ref ${ref}`);
    return [];
  }
  if (rows.length === 1) return [rowKey(rows[0])];

  const directKitTags = inferReferenceKitTags(ticket, ref);
  const kitTags = directKitTags.size > 0 ? directKitTags : inferTicketKitTags(ticket, inventoryIndex);
  const matches = rows.filter((row) => kitTags.has(row.kit));
  if (matches.length === 1) return [rowKey(matches[0])];

  errors.push(`ticket ${ticket.id} has ambiguous kit_ref ${ref}; use kit:id with one of ${rows.map(rowKey).sort().join(", ")}`);
  return [];
}

function inferReferenceKitTags(ticket, ref) {
  const kitTags = new Set();
  for (const segment of ticketText(ticket).split(/[;\n]/)) {
    for (const context of matchingRefContexts(segment, ref)) {
      const normalized = context.toLowerCase();
      if (!normalized.includes("here") && !normalized.includes("on this ticket")) continue;
      if (normalized.includes("heyclicky")) kitTags.add("Metis-HeyClicky-Interaction-Upgrade");
      if (/\bv6\b/.test(normalized) || normalized.includes("brag") || normalized.includes("launch-film")) {
        kitTags.add("v6");
      }
    }
  }
  return kitTags;
}

function inferTicketKitTags(ticket, inventoryIndex) {
  const kitTags = new Set();
  const text = ticketText(ticket).toLowerCase();

  if (text.includes("heyclicky")) kitTags.add("Metis-HeyClicky-Interaction-Upgrade");
  if (/\bv6\b/.test(text) || text.includes("brag") || text.includes("launch-film")) kitTags.add("v6");

  for (const ref of ticket.kit_refs ?? []) {
    if (inventoryIndex.keys.has(ref)) {
      kitTags.add(ref.slice(0, ref.lastIndexOf(":")));
      continue;
    }
    const rows = inventoryIndex.rowsById.get(ref) ?? [];
    if (rows.length === 1) kitTags.add(rows[0].kit);
  }
  return kitTags;
}

function ticketText(ticket) {
  return [
    ticket.title,
    ticket.summary,
    ticket.notes,
    ...(ticket.scope_paths ?? []),
    ...(ticket.acceptance ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function matchingRefContexts(segment, ref) {
  const contexts = [];
  const exactIndex = segment.indexOf(ref);
  if (exactIndex >= 0) contexts.push(segment.slice(exactIndex, exactIndex + 200));
  const refNumber = ref.match(/^REF-(\d{2})$/)?.[1];
  if (!refNumber) return contexts;
  const target = Number(refNumber);
  for (const match of segment.matchAll(/REF-(\d{2})(?:\.\.(\d{2}))?/g)) {
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (target >= start && target <= end) contexts.push(segment.slice(match.index, match.index + 200));
  }
  return contexts;
}

function addReference(byRef, ref, ticket) {
  if (!byRef.has(ref)) byRef.set(ref, []);
  byRef.get(ref).push(ticket);
}

function validateTicketReferences(ticket, { ticketIds, decisionIds, errors }) {
  for (const dependency of ticket.depends_on ?? []) {
    if (!ticketIds.has(dependency)) errors.push(`${ticket.id} depends_on dangling ticket ${dependency}`);
  }
  for (const decision of ticket.needs_decision ?? []) {
    if (!DECISION_RE.test(decision)) errors.push(`${ticket.id} has invalid needs_decision ${decision}`);
    if (!decisionIds.has(decision)) errors.push(`${ticket.id} needs_decision ${decision} missing from DECISIONS.md`);
  }
}

function extractDecisionIds(text) {
  return new Set([...text.matchAll(/\|\s*(D-\d+)\s*\|/g)].map((match) => match[1]));
}

function extractBlockerTicketIds(text) {
  const ids = new Set();
  const rows = text.split(/\r?\n/).filter((line) => line.startsWith("| B-"));
  for (const row of rows) {
    const ticketCells = row.match(/\|\s*(?:M2-)?(\d{4}):/g) ?? [];
    for (const cell of ticketCells) ids.add(`M2-${cell.match(/\d{4}/)[0]}`);
    const compactCells = row.match(/\|\s*(\d{4})\s*\|/g) ?? [];
    for (const cell of compactCells) ids.add(`M2-${cell.match(/\d{4}/)[0]}`);
  }
  return ids;
}

function validateBlockers(blockerTicketIds, ticketIds, errors) {
  for (const ticketId of blockerTicketIds) {
    if (!ticketIds.has(ticketId)) errors.push(`BLOCKERS.md cites missing ticket ${ticketId}`);
  }
}

function groupEvidence(records, errors) {
  const byTicket = new Map();
  for (const record of records) {
    if (!PROGRAM_TICKET_RE.test(record.ticket ?? "")) {
      errors.push(`evidence record ${record._record_file}:${record._record_line} has invalid ticket ${record.ticket}`);
      continue;
    }
    if (!record.kit_refs || typeof record.kit_refs !== "object" || Array.isArray(record.kit_refs)) {
      errors.push(`evidence record ${record._record_file}:${record._record_line} missing kit_refs object`);
      continue;
    }
    if (!byTicket.has(record.ticket)) byTicket.set(record.ticket, []);
    byTicket.get(record.ticket).push(record);
  }
  return byTicket;
}

function ticketSummary(ticket, row, records) {
  const evidenceStatus = latestEvidenceStatus(records, row);
  const status = evidenceStatus
    ? EVIDENCE_STATUS_TO_OUTPUT[evidenceStatus]
    : TICKET_STATUS_TO_OUTPUT[ticket.status] ?? "NOT_STARTED";
  return {
    id: ticket.id,
    status,
    ticket_status: ticket.status,
    evidence_status: evidenceStatus ?? null,
    required_evidence: ticket.required_evidence ?? [],
    needs_decision: ticket.needs_decision ?? [],
    slices: ticket.slices ?? [],
    validation_hours: ticket.validation_hours ?? null,
    due: ticket.due ?? null,
  };
}

function latestEvidenceStatus(records, row) {
  for (const record of [...records].reverse()) {
    const status = record.kit_refs[rowKey(row)] ?? record.kit_refs[row.id];
    if (status) {
      if (!Object.hasOwn(EVIDENCE_STATUS_TO_OUTPUT, status)) {
        throw new Error(`unknown evidence kit_ref status ${status} for ${rowKey(row)}`);
      }
      return status;
    }
  }
  return null;
}

function combineStatuses(statuses) {
  if (statuses.length === 0) return "NOT_STARTED";
  if (statuses.every((status) => status === "DONE")) return "DONE";
  if (statuses.includes("BLOCKED_EXTERNAL")) return "BLOCKED_EXTERNAL";
  if (statuses.includes("IN_PROGRESS")) return "IN_PROGRESS";
  if (statuses.includes("ENGINEERING_COMPLETE")) {
    return statuses.every((status) => status === "DONE" || status === "ENGINEERING_COMPLETE")
      ? "ENGINEERING_COMPLETE"
      : "IN_PROGRESS";
  }
  return statuses.includes("DONE") ? "IN_PROGRESS" : "NOT_STARTED";
}

function summarizeBy(rows, field) {
  const summary = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!summary.has(key)) summary.set(key, { [field]: key, rows: 0, mapped: 0 });
    const item = summary.get(key);
    item.rows += 1;
    if (row.tickets.length > 0) item.mapped += 1;
  }
  return [...summary.values()].sort((a, b) => String(a[field]).localeCompare(String(b[field])));
}

function findDuplicateRefRows(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!/^REF-\d{2}$/.test(row.id)) continue;
    counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
  }
  return rows.filter((row) => /^REF-\d{2}$/.test(row.id) && counts.get(row.id) > 1);
}

export function rowKey(row) {
  return `${row.kit}:${row.id}`;
}

export function renderMarkdown(matrix) {
  const lines = [];
  lines.push("# Traceability Matrix");
  lines.push("");
  lines.push("Generated deterministically from `docs/metis-2.0/kit/ID-INVENTORY.json`, `docs/metis-2.0/ledger/tickets.json`, and `docs/metis-2.0/evidence/records/*.jsonl`.");
  lines.push("");
  lines.push(`Rows mapped: ${matrix.counts.rows_mapped}/${matrix.counts.rows}. Unique IDs mapped: ${matrix.counts.unique_ids_mapped}/${matrix.counts.unique_ids}. Families: ${matrix.counts.families}.`);
  lines.push("");
  lines.push("`REF-*` rows are keyed by `kit:id`, so the HeyClicky nested-kit namespace and the v6 `SOURCE-REGISTER` namespace remain distinct.");
  lines.push("");
  lines.push("## Coverage By Family");
  lines.push("");
  lines.push("| Family | Rows | Mapped | % |");
  lines.push("|---|---:|---:|---:|");
  for (const item of matrix.families) {
    lines.push(`| ${escapeCell(item.family)} | ${item.rows} | ${item.mapped} | ${percent(item.mapped, item.rows)} |`);
  }
  lines.push("");
  lines.push("## Coverage By Kit");
  lines.push("");
  lines.push("| Kit | Rows | Mapped | % |");
  lines.push("|---|---:|---:|---:|");
  for (const item of matrix.kits) {
    lines.push(`| ${escapeCell(item.kit)} | ${item.rows} | ${item.mapped} | ${percent(item.mapped, item.rows)} |`);
  }
  lines.push("");
  lines.push("## Full Matrix");
  lines.push("");
  lines.push("| Key | ID | Family | Title | Kit | Tickets | Status | Evidence |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows) {
    const tickets = row.tickets
      .map((ticket) => `[${ticket.id}](ledger/tickets/${ticket.id}.md)`)
      .join(", ");
    const evidence = row.tickets
      .map((ticket) => `${ticket.id}:${ticket.evidence_status ?? "ledger"}`)
      .join(", ");
    lines.push(`| ${escapeCell(rowKey(row))} | ${escapeCell(row.id)} | ${escapeCell(row.family)} | ${escapeCell(row.title)} | ${escapeCell(row.kit)} | ${tickets} | ${row.status} | ${escapeCell(evidence)} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function percent(mapped, rows) {
  return rows === 0 ? "0.0%" : `${((mapped / rows) * 100).toFixed(1)}%`;
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

export async function build(paths = defaultPaths()) {
  const [inventory, ledger, records, decisionsText, blockersText] = await Promise.all([
    loadInventory(paths),
    readJson(paths.tickets),
    loadEvidenceRecords(paths.evidenceRecords),
    readFile(paths.decisions, "utf8"),
    readFile(paths.blockers, "utf8"),
  ]);
  return computeTraceability({
    inventory,
    ledger,
    evidenceRecords: records,
    decisionsText,
    blockersText,
    requiredAcceptanceIds: REQUIRED_ACCEPTANCE_IDS,
  });
}

export async function writeOutputs(paths, matrix) {
  await mkdir(path.dirname(paths.outputJson), { recursive: true });
  await writeFile(paths.outputJson, stableStringify(matrix), "utf8");
  await writeFile(paths.outputMarkdown, renderMarkdown(matrix), "utf8");
}

export async function ensureSeedInventory(paths) {
  const inventory = await loadInventory(paths);
  await mkdir(path.dirname(paths.inventory), { recursive: true });
  await writeFile(paths.inventory, stableStringify(inventory), "utf8");
  return inventory;
}

export async function checkOutputs(paths, matrix) {
  const expectedJson = stableStringify(matrix);
  const expectedMarkdown = renderMarkdown(matrix);
  const [actualJson, actualMarkdown] = await Promise.all([
    readFile(paths.outputJson, "utf8"),
    readFile(paths.outputMarkdown, "utf8"),
  ]);
  const mismatches = [];
  if (actualJson !== expectedJson) mismatches.push(paths.outputJson);
  if (actualMarkdown !== expectedMarkdown) mismatches.push(paths.outputMarkdown);
  return mismatches;
}

export function outputDigest(matrix) {
  return createHash("sha256").update(stableStringify(matrix)).digest("hex");
}

async function main() {
  const check = process.argv.includes("--check");
  const paths = defaultPaths();
  await ensureSeedInventory(paths);
  const { errors, matrix } = await build(paths);
  if (errors.length > 0) {
    for (const error of errors) console.error(`traceability: ${error}`);
    process.exitCode = 1;
    return;
  }
  if (check) {
    const mismatches = await checkOutputs(paths, matrix);
    if (mismatches.length > 0) {
      for (const mismatch of mismatches) console.error(`traceability: generated output is stale: ${path.relative(paths.root, mismatch)}`);
      process.exitCode = 1;
      return;
    }
    console.log(`traceability: ok (${matrix.counts.rows_mapped}/${matrix.counts.rows} rows, sha256 ${outputDigest(matrix)})`);
    return;
  }
  await writeOutputs(paths, matrix);
  console.log(`traceability: wrote ${path.relative(paths.root, paths.outputMarkdown)} and ${path.relative(paths.root, paths.outputJson)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
