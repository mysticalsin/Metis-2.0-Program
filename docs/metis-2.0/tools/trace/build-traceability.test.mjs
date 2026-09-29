import assert from "node:assert/strict";
import test from "node:test";
import {
  computeTraceability,
  renderMarkdown,
  seedInventoryFromTraceability,
} from "./build-traceability.mjs";

const baseTicket = (overrides) => ({
  id: "M2-0001",
  title: "Ticket",
  depends_on: [],
  needs_decision: [],
  kit_refs: ["TASK-001"],
  finding_refs: [],
  required_evidence: ["LOCALLY_TESTED"],
  external_blocker: null,
  status: "TODO",
  validation_hours: 1,
  slices: [],
  due: null,
  ...overrides,
});

const inventory = {
  rows: [
    {
      id: "TASK-001",
      family: "TASK",
      title: "Task one",
      kit: "r11",
      source_file: "plan/tasks/TASK-001.md",
      source_ref: "TASK-001",
      parent_task: "",
      sources: [{ source_file: "plan/tasks/TASK-001.md", source_ref: "TASK-001" }],
    },
  ],
};

test("maps inventory rows to tickets and computes evidence-driven status", () => {
  const result = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ status: "IN_PROGRESS" })] },
    evidenceRecords: [
      {
        ticket: "M2-0001",
        evidence_level: "LOCALLY_TESTED",
        kit_refs: { "TASK-001": "MET" },
        _record_file: "fixture.jsonl",
        _record_line: 1,
      },
    ],
    decisionsText: "| D-1 | question | default | class | due | OPEN | 0001 |",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.matrix.rows[0].status, "DONE");
  assert.equal(result.matrix.rows[0].tickets[0].evidence_status, "MET");
});

test("aggregates multi-ticket rows conservatively", () => {
  const result = computeTraceability({
    inventory,
    ledger: {
      tickets: [
        baseTicket({ id: "M2-0001", status: "DONE" }),
        baseTicket({ id: "M2-0002", status: "IN_PROGRESS" }),
      ],
    },
    decisionsText: "",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.matrix.rows[0].status, "IN_PROGRESS");
});

test("accepts canonical alphanumeric M2 kit families without accepting program ticket refs", () => {
  const result = computeTraceability({
    inventory: {
      rows: [{ ...inventory.rows[0], id: "M2-E2E-01", family: "M2" }],
    },
    ledger: { tickets: [baseTicket({ kit_refs: ["M2-E2E-01"] })] },
    decisionsText: "",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
});

test("fails unmapped inventory rows", () => {
  const result = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ kit_refs: ["TASK-002"] })] },
    decisionsText: "",
    blockersText: "",
  });

  assert.match(result.errors.join("\n"), /unmapped inventory row r11:TASK-001/);
});

test("fails dangling ticket kit_refs", () => {
  const result = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ kit_refs: ["TASK-001", "NO-SUCH-ID"] })] },
    decisionsText: "",
    blockersText: "",
  });

  assert.match(result.errors.join("\n"), /ticket M2-0001 has dangling kit_ref NO-SUCH-ID/);
});

test("validates M2 names without accepting a bare prefix", () => {
  const invalidPrefix = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ kit_refs: ["M2-"] })] },
    decisionsText: "",
    blockersText: "",
  });
  assert.match(invalidPrefix.errors.join("\n"), /invalid M2 kit ref M2-/);

  const validRequirement = computeTraceability({
    inventory: {
      rows: [{ ...inventory.rows[0], id: "M2-ENG-01", family: "M2" }],
    },
    ledger: { tickets: [baseTicket({ kit_refs: ["M2-ENG-01"] })] },
    decisionsText: "",
    blockersText: "",
  });
  assert.equal(validRequirement.errors.some((error) => error.includes("invalid M2 kit ref")), false);
});

test("disambiguates duplicated REF namespaces by kit tag", () => {
  const duplicatedInventory = {
    rows: [
      { ...inventory.rows[0], id: "REF-01", family: "REF", kit: "Metis-HeyClicky-Interaction-Upgrade" },
      { ...inventory.rows[0], id: "REF-01", family: "REF", kit: "v6" },
      { ...inventory.rows[0], id: "LF-01", family: "LF", kit: "v6" },
    ],
  };
  const result = computeTraceability({
    inventory: duplicatedInventory,
    ledger: {
      tickets: [
        baseTicket({ id: "M2-0001", title: "HeyClicky ticket", kit_refs: ["REF-01"] }),
        baseTicket({ id: "M2-0002", title: "v6 ticket", kit_refs: ["LF-01", "REF-01"] }),
      ],
    },
    decisionsText: "",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
  const byKey = new Map(result.matrix.rows.map((row) => [`${row.kit}:${row.id}`, row]));
  assert.deepEqual(byKey.get("Metis-HeyClicky-Interaction-Upgrade:REF-01").tickets.map((ticket) => ticket.id), [
    "M2-0001",
  ]);
  assert.deepEqual(byKey.get("v6:REF-01").tickets.map((ticket) => ticket.id), ["M2-0002"]);
  assert.deepEqual(byKey.get("v6:LF-01").tickets.map((ticket) => ticket.id), ["M2-0002"]);
});

test("uses local REF range notes before broader ticket namespace hints", () => {
  const duplicatedInventory = {
    rows: [
      { ...inventory.rows[0], id: "REF-15", family: "REF", kit: "Metis-HeyClicky-Interaction-Upgrade" },
      { ...inventory.rows[0], id: "REF-15", family: "REF", kit: "v6" },
    ],
  };
  const result = computeTraceability({
    inventory: duplicatedInventory,
    ledger: {
      tickets: [
        baseTicket({
          id: "M2-0001",
          summary: "v6 is mentioned earlier. REF-15..17 on this ticket are the HeyClicky interaction kit records; the v6 records sit elsewhere.",
          kit_refs: ["REF-15"],
        }),
        baseTicket({
          id: "M2-0002",
          summary: "REF-15 here is the v6 Hindsight record.",
          kit_refs: ["REF-15"],
        }),
      ],
    },
    decisionsText: "",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
  const byKey = new Map(result.matrix.rows.map((row) => [`${row.kit}:${row.id}`, row]));
  assert.deepEqual(byKey.get("Metis-HeyClicky-Interaction-Upgrade:REF-15").tickets.map((ticket) => ticket.id), [
    "M2-0001",
  ]);
  assert.deepEqual(byKey.get("v6:REF-15").tickets.map((ticket) => ticket.id), ["M2-0002"]);
});

test("accepts DEFERRED evidence kit_ref status", () => {
  const result = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ status: "IN_PROGRESS" })] },
    evidenceRecords: [
      {
        ticket: "M2-0001",
        evidence_level: "LOCALLY_TESTED",
        kit_refs: { "TASK-001": "DEFERRED" },
        _record_file: "fixture.jsonl",
        _record_line: 1,
      },
    ],
    decisionsText: "",
    blockersText: "",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.matrix.rows[0].status, "ENGINEERING_COMPLETE");
  assert.equal(result.matrix.rows[0].tickets[0].evidence_status, "DEFERRED");
});

test("checks dangling decisions and blocker ticket citations", () => {
  const result = computeTraceability({
    inventory,
    ledger: {
      tickets: [
        baseTicket({
          needs_decision: ["D-99"],
        }),
      ],
    },
    decisionsText: "| D-1 | question | default | class | due | OPEN | 0001 |",
    blockersText: "| B-01 | 9999: missing ticket | step | 2026-09-27 |",
  });

  assert.match(result.errors.join("\n"), /needs_decision D-99 missing/);
  assert.match(result.errors.join("\n"), /BLOCKERS.md cites missing ticket M2-9999/);
});

test("seeds canonical inventory fields unchanged from traceability rows", () => {
  const seeded = seedInventoryFromTraceability({
    rows: [
      {
        ...inventory.rows[0],
        tickets: ["M2-0001"],
        status: "TODO",
      },
    ],
  });

  assert.deepEqual(Object.keys(seeded.rows[0]).sort(), [
    "family",
    "id",
    "kit",
    "parent_task",
    "source_file",
    "source_ref",
    "sources",
    "title",
  ]);
});

test("renders deterministic markdown without dates", () => {
  const result = computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket({ status: "DONE" })] },
    decisionsText: "",
    blockersText: "",
  });
  const markdown = renderMarkdown(result.matrix);

  assert.match(markdown, /Generated deterministically/);
  assert.doesNotMatch(markdown, /2026-\d{2}-\d{2}/);
});

const capabilityFixture = (overrides = {}) => ({
  artifact: {
    version: "1.0.51",
    build: "61",
    sha256: "0".repeat(64),
    evidence_level: "STATIC_INSPECTION",
    evidence_limits: "Static inspection only.",
  },
  capabilities: Array.from({ length: 48 }, (_, index) => ({
    id: `CAP-${String(index + 1).padStart(2, "0")}`,
    name: `resource-${index + 1}`,
    reference_path: `Contents/Resources/resource-${index + 1}.md`,
    reference_sha256: "a".repeat(64),
    disposition: "Core",
    metis_home: "Artifact Library",
    owner: "M2-0001",
    evidence_level: "STATIC_INSPECTION",
  })),
  parity_refresh_points: ["T1", "T2", "T3", "rc1"],
  parity: [{ id: "CXCAP-01", label: "static", source_ref: "CAPABILITY-MATRIX.json items[0]" }],
  ...overrides,
});

const capabilityErrors = (capabilityDispositions, rows = []) =>
  computeTraceability({
    inventory: { rows: [...inventory.rows, ...rows] },
    ledger: {
      tickets: [
        baseTicket({ kit_refs: ["TASK-001", ...rows.map((row) => row.id)] }),
      ],
    },
    decisionsText: "",
    blockersText: "",
    capabilityDispositions,
  }).errors.join("\n");

const cxcapRow = { ...inventory.rows[0], id: "CXCAP-01", family: "CXCAP", kit: "v5" };

test("accepts a complete capability map with labelled parity ids", () => {
  assert.equal(capabilityErrors(capabilityFixture(), [cxcapRow]), "");
});

test("fails a capability row with no owner or an owner that is not a ticket", () => {
  const missingOwner = capabilityFixture();
  delete missingOwner.capabilities[0].owner;
  assert.match(capabilityErrors(missingOwner), /unmapped capability row CAP-01: missing owner/);

  const missingTicket = capabilityFixture();
  missingTicket.capabilities[1].owner = "M2-9999";
  assert.match(capabilityErrors(missingTicket), /CAP-02 owner M2-9999 is a missing ticket/);

  const marker = capabilityFixture();
  marker.capabilities[2].owner = "EXCLUDED";
  assert.equal(capabilityErrors(marker), "");
});

test("fails when the capability map does not have exactly 48 rows", () => {
  const short = capabilityFixture();
  short.capabilities.pop();
  assert.match(capabilityErrors(short), /expected 48 rows, found 47/);
});

test("fails an unlabelled or wrongly labelled CXCAP parity id", () => {
  const unlabelled = capabilityFixture({ parity: [] });
  assert.match(capabilityErrors(unlabelled, [cxcapRow]), /unlabelled parity id CXCAP-01/);

  const invalid = capabilityFixture({ parity: [{ id: "CXCAP-01", label: "works", source_ref: "x" }] });
  assert.match(capabilityErrors(invalid, [cxcapRow]), /unlabelled parity id CXCAP-01/);
});

test("fails a parity table without the T1..T3 and rc1 refresh points", () => {
  const noRefresh = capabilityFixture({ parity_refresh_points: ["T1"] });
  assert.match(capabilityErrors(noRefresh), /label refresh at T2/);
  assert.match(capabilityErrors(noRefresh), /label refresh at rc1/);
});

test("required acceptance ids must exist and be named in a mapped ticket acceptance", () => {
  const flowInventory = { rows: [{ ...inventory.rows[0], id: "HM-FLOW-01", family: "HMFLOW" }] };
  const run = (inv, ticket) =>
    computeTraceability({
      inventory: inv,
      ledger: { tickets: [ticket] },
      decisionsText: "",
      blockersText: "",
      requiredAcceptanceIds: ["HM-FLOW-01"],
    }).errors.join("\n");

  assert.match(run(inventory, baseTicket()), /required inventory id HM-FLOW-01 is missing/);
  assert.match(
    run(flowInventory, baseTicket({ kit_refs: ["HM-FLOW-01"], acceptance: ["unrelated"] })),
    /HM-FLOW-01 is not named in the acceptance/,
  );
  assert.equal(
    run(flowInventory, baseTicket({ kit_refs: ["HM-FLOW-01"], acceptance: ["HM-FLOW-01 journey passes"] })),
    "",
  );
});
