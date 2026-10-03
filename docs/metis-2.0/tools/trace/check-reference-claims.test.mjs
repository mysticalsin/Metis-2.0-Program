import assert from "node:assert/strict";
import test from "node:test";
import {
  checkFiles,
  checkJson,
  checkMarkdown,
  checkParityTable,
  checkReferenceRegister,
  defaultFiles,
  registerKey,
} from "./check-reference-claims.mjs";

const SHA = "a".repeat(64);
const PIN = `version 1.0.51 build 61 sha256 ${SHA} evidence level STATIC_INSPECTION`;
const table = (...rows) => ["| Item | Decision |", "|---|---|", ...rows, ""].join("\n");

test("passes a HeyClicky adoption row that carries version, build, sha256 and evidence level", () => {
  const text = table(`| HeyClicky hotkey | adopt as a pattern, ${PIN} |`);
  assert.deepEqual(checkMarkdown(text, "fixture.md"), []);
});

test("fails a HeyClicky adoption or comparison row that lacks any pin field", () => {
  const cases = [
    ["| HeyClicky hotkey | adopt, build 61 sha256 " + SHA + " STATIC_INSPECTION |", "version"],
    ["| HeyClicky hotkey | adopt, version 1.0.51 sha256 " + SHA + " STATIC_INSPECTION |", "build"],
    ["| HeyClicky hotkey | adopt, version 1.0.51 build 61 STATIC_INSPECTION |", "sha256"],
    [`| HeyClicky hotkey | compare, version 1.0.51 build 61 sha256 ${SHA} |`, "evidence level"],
  ];
  for (const [row, field] of cases) {
    const errors = checkMarkdown(table(row), "fixture.md");
    assert.equal(errors.length, 1, row);
    assert.match(errors[0], new RegExp(`fixture.md:3: HeyClicky record lacks ${field}`));
  }
});

test("fails a bare HeyClicky adoption row and a marked ADOPTION line", () => {
  assert.match(checkMarkdown(table("| HeyClicky ghost cursor | adopt |"), "f.md").join("\n"), /lacks version, build, sha256, evidence level/);
  assert.match(checkMarkdown("ADOPTION: HeyClicky floating cursor is adopted\n", "f.md").join("\n"), /f.md:1: HeyClicky record lacks/);
  assert.deepEqual(checkMarkdown(`ADOPTION: HeyClicky floating cursor, ${PIN}\n`, "f.md"), []);
});

test("ignores rows that do not cite HeyClicky and header rows", () => {
  const text = ["| HeyClicky adoption header | Decision |", "|---|---|", "| Cua Driver | adopt |", ""].join("\n");
  assert.deepEqual(checkMarkdown(text, "f.md"), []);
});

test("fails a changelog claim that is not labelled VENDOR_CLAIM and passes it once labelled", () => {
  const unlabelled = table(`| HeyClicky changelog: floating cursor removed | reject, ${PIN} |`);
  assert.match(checkMarkdown(unlabelled, "f.md").join("\n"), /changelog claim is not labelled VENDOR_CLAIM/);

  const asInstalled = table(`| HeyClicky 1.0.52 release notes: feature installed | adopt, ${PIN} |`);
  assert.match(checkMarkdown(asInstalled, "f.md").join("\n"), /not labelled VENDOR_CLAIM/);

  const labelled = table(`| HeyClicky changelog: floating cursor removed | reject, VENDOR_CLAIM, ${PIN} |`);
  assert.deepEqual(checkMarkdown(labelled, "f.md"), []);
});

const jsonDoc = (overrides = {}) =>
  JSON.stringify({
    artifact: { version: "1.0.51", build: "61", sha256: SHA, evidence_level: "STATIC_INSPECTION" },
    capabilities: [{ id: "CAP-01", path: "Contents/Resources/ClickyBundledSkills/x.md", evidence_level: "STATIC_INSPECTION" }],
    parity: [{ id: "CXCAP-01", label: "static", evidence_level: "STATIC_INSPECTION", note: "Packaged hotkey" }],
    ...overrides,
  });

test("accepts a JSON register with a full artifact block and evidence levels", () => {
  assert.deepEqual(checkJson(jsonDoc(), "f.json"), []);
});

test("fails a JSON register whose artifact block or row evidence level is missing", () => {
  assert.match(checkJson(jsonDoc({ artifact: { version: "1.0.51" } }), "f.json").join("\n"), /artifact block lacks build, sha256, evidence_level/);
  assert.match(
    checkJson(jsonDoc({ parity: [{ id: "CXCAP-01", label: "static", note: "x" }] }), "f.json").join("\n"),
    /parity\[0\] CXCAP-01: evidence_level must be one of/,
  );
  assert.match(
    checkJson(jsonDoc({ parity: [{ id: "CXCAP-02", label: "verified locally", evidence_level: "STATIC_INSPECTION" }] }), "f.json").join("\n"),
    /needs evidence_level VERIFIED_LOCALLY/,
  );
});

test("fails a JSON row that cites the changelog without VENDOR_CLAIM", () => {
  const bad = jsonDoc({
    parity: [{ id: "CXCAP-06", label: "documented", evidence_level: "DOCUMENTED", note: "Vendor changelog removes the cursor" }],
  });
  assert.match(checkJson(bad, "f.json").join("\n"), /changelog claim is not labelled VENDOR_CLAIM/);
  const good = jsonDoc({
    parity: [{ id: "CXCAP-06", label: "documented", evidence_level: "DOCUMENTED", note: "Vendor changelog removes the cursor (VENDOR_CLAIM)" }],
  });
  assert.deepEqual(checkJson(good, "f.json"), []);
  assert.match(checkJson("{", "f.json")[0], /invalid JSON/);
});

const inventoryRows = [
  { id: "R25", family: "R", kit: "r11" },
  { id: "REF-01", family: "REF", kit: "Metis-HeyClicky-Interaction-Upgrade" },
  { id: "REF-01", family: "REF", kit: "v6" },
  { id: "F-01", family: "F", kit: "r11" },
];
const registerRow = (key, overrides = {}) => {
  const cells = {
    key,
    reference: "Mobile Jev",
    kind: "REFERENCE",
    pin: "README blob 4684f74",
    licence: "LIC-UNKNOWN",
    security: "SEC-REPO",
    decision: "adapt (pattern only)",
    label: "OBSERVED MASTER.md",
    ...overrides,
  };
  return `| ${Object.values(cells).join(" | ")} |`;
};
const registerHeader = "| Key | Reference | Kind | Pin | Licence | Security notes | Decision | Label and source |\n|---|---|---|---|---|---|---|---|";
const fullRegister = [
  registerHeader,
  registerRow("r11:R25"),
  registerRow("hc-kit:REF-01"),
  registerRow("v6:REF-01"),
].join("\n");

test("register keys keep the two REF namespaces distinct", () => {
  assert.equal(registerKey(inventoryRows[1]), "hc-kit:REF-01");
  assert.equal(registerKey(inventoryRows[2]), "v6:REF-01");
});

test("accepts a register with a complete row for every R and REF id", () => {
  assert.deepEqual(checkReferenceRegister(fullRegister, inventoryRows, "r.md"), []);
});

test("fails a register with a missing row, an empty cell, a bad decision or an unknown row", () => {
  const missing = [registerHeader, registerRow("r11:R25"), registerRow("hc-kit:REF-01")].join("\n");
  assert.match(checkReferenceRegister(missing, inventoryRows, "r.md").join("\n"), /no register row for v6:REF-01/);

  const emptyLicence = [fullRegister, ""].join("\n").replace("LIC-UNKNOWN", "");
  assert.match(checkReferenceRegister(emptyLicence, inventoryRows, "r.md").join("\n"), /empty licence/);

  const badDecision = fullRegister.replace("adapt (pattern only)", "maybe later");
  assert.match(checkReferenceRegister(badDecision, inventoryRows, "r.md").join("\n"), /decision must start with adopt, adapt or reject/);

  const extra = [fullRegister, registerRow("r11:R99")].join("\n");
  assert.match(checkReferenceRegister(extra, inventoryRows, "r.md").join("\n"), /register row r11:R99 is not in ID-INVENTORY.json/);

  const badKind = fullRegister.replace("REFERENCE", "RUNTIME");
  assert.match(checkReferenceRegister(badKind, inventoryRows, "r.md").join("\n"), /kind must be one of/);
});

test("validates owner-supplied reference rows outside the inventory namespace", () => {
  const ownerRow = registerRow("owner:OREF-01", {
    reference: "Owner-supplied Bluey reference repository",
    pin: "Commit UNKNOWN; study date 2026-10-03",
    licence: "no licence file found: treated as all rights reserved (not legal advice)",
    security: "Never built or run; informs behaviour only",
    decision: "adapt: behaviour only; no code, prompt text, assets or character art copied",
    label: "OBSERVED ledger M2-0544 and DECISIONS OD-56",
  });
  assert.deepEqual(checkReferenceRegister([fullRegister, ownerRow].join("\n"), inventoryRows, "r.md"), []);

  const emptyCell = ownerRow.replace("Commit UNKNOWN; study date 2026-10-03", "");
  assert.match(checkReferenceRegister([fullRegister, emptyCell].join("\n"), inventoryRows, "r.md").join("\n"), /owner:OREF-01: empty pin/);

  const badDecision = ownerRow.replace("adapt: behaviour only", "maybe: behaviour only");
  assert.match(
    checkReferenceRegister([fullRegister, badDecision].join("\n"), inventoryRows, "r.md").join("\n"),
    /owner:OREF-01: decision must start with adopt, adapt or reject/,
  );
});

test("fails a parity table row that disagrees with the JSON", () => {
  const dispositions = { parity: [{ id: "CXCAP-01", label: "static" }, { id: "CXCAP-02", label: "missing" }] };
  const rows = ["| Id | Capability | Label |", "|---|---|---|", "| CXCAP-01 | Toggle | static |", "| CXCAP-02 | Voice | static |"].join("\n");
  const errors = checkParityTable(rows, dispositions, "p.md").join("\n");
  assert.match(errors, /CXCAP-02 is labelled "static" but the JSON says "missing"/);
  assert.match(checkParityTable("| CXCAP-01 | Toggle | static |", dispositions, "p.md").join("\n"), /no row for CXCAP-02/);
});

test("the committed registers pass every check", async () => {
  assert.deepEqual(await checkFiles(defaultFiles()), []);
});
