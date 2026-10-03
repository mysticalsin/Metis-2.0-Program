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

// The default M2-0001 ticket cites every fixture capability, so the owner-citation rule passes.
const citingTicket = (overrides = {}) =>
  baseTicket({
    finding_refs: Array.from({ length: 48 }, (_, index) => `CAPADOPT-resource-${index + 1}`),
    ...overrides,
  });

const capabilityResult = (capabilityDispositions, rows = [], extraTickets = [], ticketOverrides = {}) =>
  computeTraceability({
    inventory: { rows: [...inventory.rows, ...rows] },
    ledger: {
      tickets: [
        citingTicket({ kit_refs: ["TASK-001", ...rows.map((row) => row.id)], ...ticketOverrides }),
        ...extraTickets,
      ],
    },
    decisionsText: "",
    blockersText: "",
    capabilityDispositions,
  });

const capabilityErrors = (...args) => capabilityResult(...args).errors.join("\n");

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

test("fails when an owner ticket does not cite the capability in finding_refs or acceptance", () => {
  const map = capabilityFixture();
  assert.match(
    capabilityErrors(map, [], [], { finding_refs: [] }),
    /capability row CAP-01 owner M2-0001 does not cite CAPADOPT-resource-1 in finding_refs or acceptance/,
  );
  assert.equal(
    capabilityErrors(map, [], [], {
      finding_refs: [],
      acceptance: Array.from({ length: 48 }, (_, index) => `CAP-${String(index + 1).padStart(2, "0")} is proved`),
    }),
    "",
  );
  assert.equal(
    capabilityErrors(map, [], [], {
      finding_refs: Array.from({ length: 48 }, (_, index) => `resource-${index + 1}`),
    }),
    "",
  );
});

test("checks every also_owners ticket and turns a declared citation_gap into a warning", () => {
  const map = capabilityFixture();
  map.capabilities[0].also_owners = ["M2-0002"];
  assert.match(capabilityErrors(map), /CAP-01 also_owners entry M2-0002 is not an existing M2 ticket/);
  const second = baseTicket({ id: "M2-0002", finding_refs: [] });
  assert.match(capabilityErrors(map, [], [second]), /CAP-01 owner M2-0002 does not cite CAPADOPT-resource-1/);

  map.capabilities[0].citation_gap = "LEAD_ACTION add the ref";
  const result = capabilityResult(map, [], [second]);
  assert.equal(result.errors.join("\n"), "");
  assert.match(result.warnings.join("\n"), /CAP-01 owner M2-0002 does not cite .*LEAD_ACTION add the ref/);
});

test("rejects a citation_gap without a LEAD_ACTION and counts acceptance citations as citing", () => {
  const map = capabilityFixture();
  const second = baseTicket({ id: "M2-0002", finding_refs: [] });
  map.capabilities[0].also_owners = ["M2-0002"];
  map.capabilities[0].citation_gap = "free text only";
  assert.match(capabilityErrors(map, [], [second]), /CAP-01 owner M2-0002 does not cite CAPADOPT-resource-1/);

  const notTested = capabilityFixture();
  notTested.capabilities[4].owner = "NOT_TESTED";
  const byAcceptance = { finding_refs: [], acceptance: ["Proves CAPADOPT-resource-5 end to end"] };
  assert.match(capabilityErrors(notTested, [], [], byAcceptance), /CAP-05 is NOT_TESTED but M2-0001 cites CAPADOPT-resource-5/);
});

test("fails a NOT_TESTED row while a ticket citing its CAPADOPT id exists", () => {
  const map = capabilityFixture();
  map.capabilities[4].owner = "NOT_TESTED";
  assert.match(capabilityErrors(map), /capability row CAP-05 is NOT_TESTED but M2-0001 cites CAPADOPT-resource-5/);
  // with no ticket citing the id, the NOT_TESTED error is gone (other rows now report their owner's missing citation,
  // the M2-0442 rule, so only this error's absence is asserted)
  assert.doesNotMatch(capabilityErrors(map, [], [], { finding_refs: [] }), /is NOT_TESTED but/);
});

test("fails a MET capability row while an owner or citing ticket is open", () => {
  const map = capabilityFixture();
  map.capabilities[0].status = "MET";
  assert.match(capabilityErrors(map), /capability row CAP-01 is MET while ticket M2-0001 \(TODO\) is still open/);
  assert.equal(capabilityErrors(map, [], [], { status: "DONE" }), "");

  const citing = baseTicket({ id: "M2-0003", finding_refs: ["CAPADOPT-resource-1"], status: "IN_PROGRESS" });
  assert.match(capabilityErrors(map, [], [citing], { status: "DONE" }), /CAP-01 is MET while ticket M2-0003 \(IN_PROGRESS\)/);

  map.capabilities[0].status = "DONE";
  assert.match(capabilityErrors(map), /CAP-01 has invalid status DONE/);
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

const ownerReferenceFixture = (overrides = {}) => ({
  schema: "metis.owner-reference-dispositions.v1",
  reference: "owner:OREF-01",
  cov_links: ["COV-43"],
  capabilities: [
    {
      id: "OREF-CAP-01",
      capability: "On-device OCR with word boxes",
      disposition: "adopt-behaviour",
      owner: "M2-0545",
    },
    {
      id: "OREF-CAP-02",
      capability: "Grounding manifest for the planner",
      disposition: "already-covered",
      owner: "M2-0546",
    },
    {
      id: "OREF-CAP-03",
      capability: "Phone voice front end and local network control",
      disposition: "conflicts",
      owner: "EXCLUDED",
      reason: "Conflicts with OD-12.",
      citations: ["OD-12"],
    },
  ],
  ...overrides,
});

const ownerTickets = ["M2-0545", "M2-0546", "M2-0547", "M2-0548"].map((id) => baseTicket({ id, kit_refs: [] }));
const ownerReferenceErrors = (ownerReferenceDispositions) =>
  computeTraceability({
    inventory,
    ledger: { tickets: [baseTicket(), ...ownerTickets] },
    decisionsText: "",
    blockersText: "",
    ownerReferenceDispositions,
  }).errors.join("\n");

test("accepts owner reference dispositions that cite COV-43 and known M2 owners", () => {
  assert.equal(ownerReferenceErrors(ownerReferenceFixture()), "");
});

test("fails owner reference dispositions with no disposition or bad ownership", () => {
  const noDisposition = ownerReferenceFixture();
  delete noDisposition.capabilities[0].disposition;
  assert.match(ownerReferenceErrors(noDisposition), /OREF-CAP-01: missing disposition/);

  const missingTicket = ownerReferenceFixture();
  missingTicket.capabilities[0].owner = "M2-9999";
  assert.match(ownerReferenceErrors(missingTicket), /OREF-CAP-01: owner M2-9999 is a missing ticket/);

  const badOwner = ownerReferenceFixture();
  badOwner.capabilities[0].owner = "EXCLUDED";
  assert.match(ownerReferenceErrors(badOwner), /OREF-CAP-01: owner must be an M2 ticket/);

  const unknownOwner = ownerReferenceFixture();
  unknownOwner.capabilities[1].owner = "OWNER";
  assert.match(ownerReferenceErrors(unknownOwner), /OREF-CAP-02: owner must be an M2 ticket/);

  const badExcludedOwner = ownerReferenceFixture();
  badExcludedOwner.capabilities[2].owner = "M2-0547";
  assert.match(ownerReferenceErrors(badExcludedOwner), /OREF-CAP-03: owner must be EXCLUDED/);
});

test("fails owner reference dispositions with missing COV-43, uncited conflicts or source details", () => {
  const missingCov = ownerReferenceFixture({ cov_links: ["COV-18"] });
  assert.match(ownerReferenceErrors(missingCov), /missing COV-43 link/);

  const conflictWithoutCitation = ownerReferenceFixture();
  conflictWithoutCitation.capabilities[2].reason = "Conflicts with the roadmap.";
  conflictWithoutCitation.capabilities[2].citations = [];
  assert.match(ownerReferenceErrors(conflictWithoutCitation), /OREF-CAP-03: conflicts rows need an OD or COV citation/);

  const sourcePath = ownerReferenceFixture();
  sourcePath.capabilities[0].detail = "Keep implementation notes out of src/main/example.ts";
  assert.match(ownerReferenceErrors(sourcePath), /OREF-CAP-01: row must not contain source-file paths/);

  const fileLine = ownerReferenceFixture();
  fileLine.capabilities[1].detail = "Keep file:line notes out of example.ts:12";
  assert.match(ownerReferenceErrors(fileLine), /OREF-CAP-02: row must not contain source-file paths/);

  const forbiddenField = ownerReferenceFixture();
  forbiddenField.capabilities[0].function = "private detail";
  assert.match(ownerReferenceErrors(forbiddenField), /OREF-CAP-01 contains forbidden field function/);
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
