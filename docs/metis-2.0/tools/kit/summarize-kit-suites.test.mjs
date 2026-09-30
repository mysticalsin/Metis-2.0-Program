import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  EXCLUDED_EXTENSIONS,
  EXPECTED_SUITES,
  NOT_RUN_SUITES,
  buildRows,
  classifySuite,
  missingPaths,
  parseTestCount,
  renderMarkdown,
  shouldFailJob,
} from "./summarize-kit-suites.mjs";

const SCRATCH = "/scratch";
const nodeTest = "node --test tests/*.test.mjs";
const spec = (n) => `ℹ tests ${n}\nℹ pass ${n}\nℹ fail 0\n`;
const classify = (over) =>
  classifySuite({ suite: "x", command: "python3 check.py", exitCode: 1, output: "", scratch: SCRATCH, cwd: SCRATCH, exists: () => false, ...over });

test("exit code 0 is PASS", () => {
  assert.equal(classify({ exitCode: 0, output: "ok\n" }).status, "PASS");
});

test("non-zero exit with no missing file is FAIL", () => {
  assert.equal(classify({ output: "AssertionError: 1 !== 2\n" }).status, "FAIL");
});

test("node --test counts are parsed from spec and TAP output", () => {
  assert.equal(parseTestCount(spec(306)), 306);
  assert.equal(parseTestCount("# tests 60\n# pass 60\n"), 60);
  assert.equal(parseTestCount(`ℹ tests 3\n${spec(9)}`), 9);
  assert.equal(parseTestCount("no summary"), null);
});

test("a passing node --test run records its test count", () => {
  const r = classify({ suite: "v5-negative-controls", command: nodeTest, exitCode: 0, output: spec(12) });
  assert.deepEqual([r.status, r.tests], ["PASS", 12]);
});

test("a zero-test node --test run with exit 0 is FAIL", () => {
  const r = classify({ command: nodeTest, exitCode: 0, output: spec(0) });
  assert.equal(r.status, "FAIL");
  assert.equal(r.tests, 0);
  assert.match(r.reason, /zero tests/);
  assert.equal(classify({ command: nodeTest, exitCode: 0, output: "" }).status, "FAIL");
});

test("behavior-core below 306 tests and r11 memory below 60 tests are FAIL", () => {
  assert.equal(classify({ suite: "behavior-core", command: nodeTest, exitCode: 0, output: spec(305) }).status, "FAIL");
  assert.equal(classify({ suite: "behavior-core", command: nodeTest, exitCode: 0, output: spec(306) }).status, "PASS");
  assert.equal(classify({ suite: "r11-memory", command: nodeTest, exitCode: 0, output: spec(59) }).status, "FAIL");
  assert.equal(classify({ suite: "r11-memory", command: nodeTest, exitCode: 0, output: spec(60) }).status, "PASS");
});

test("a missing file with an excluded extension is PRECONDITION_MISSING", () => {
  const node = `Error: Cannot find module '${SCRATCH}/r11/integration/agents/agent-contract.js'\n`;
  const r = classify({ output: node });
  assert.equal(r.status, "PRECONDITION_MISSING");
  assert.match(r.reason, /r11\/integration\/agents\/agent-contract\.js/);

  const py = "FileNotFoundError: [Errno 2] No such file or directory: 'preview/app.css'\n";
  assert.equal(classify({ output: py, cwd: `${SCRATCH}/r11/onboarding` }).status, "PRECONDITION_MISSING");
});

test("a missing file with a non-excluded extension is FAIL", () => {
  const r = classify({ output: `Error: Cannot find module '${SCRATCH}/r11/verification/helper.cjs'\n` });
  assert.equal(r.status, "FAIL");
  assert.equal(classify({ output: "can't open file '/scratch/v5/tools/gone.py'\n" }).status, "FAIL");
  assert.equal(classify({ output: "Error: Cannot find module 'typescript'\n" }).status, "FAIL");
});

test("one non-excluded missing file among excluded ones is FAIL", () => {
  const output = `Cannot find module '${SCRATCH}/a.js'\nNo such file or directory: '${SCRATCH}/b.py'\n`;
  assert.equal(classify({ output }).status, "FAIL");
});

test("an excluded-extension file that exists, or lies outside the copy, is FAIL", () => {
  const output = `Cannot find module '${SCRATCH}/a.js'\n`;
  assert.equal(classify({ output, exists: () => true }).status, "FAIL");
  assert.equal(classify({ output: "No such file or directory: '/etc/nowhere.png'\n" }).status, "FAIL");
});

test("a missing file does not matter when the suite exits 0", () => {
  assert.equal(classify({ exitCode: 0, output: `Cannot find module '${SCRATCH}/a.js'\n` }).status, "PASS");
});

test("missingPaths reads Node ENOENT messages", () => {
  assert.deepEqual(missingPaths("Error: ENOENT: no such file or directory, open '/scratch/x.tsx'\n"), ["/scratch/x.tsx"]);
});

test("the excluded extensions match kit/README.md's exclusion table", () => {
  const readme = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../../kit/README.md"),
    "utf8",
  );
  const fromReadme = [...readme.matchAll(/^\| extension (\.\w+) not in whitelist \|/gm)].map((m) => m[1]).sort();
  assert.ok(fromReadme.length > 0);
  assert.deepEqual([...EXCLUDED_EXTENSIONS].sort(), fromReadme);
});

const tsvFor = (suites) => suites.map((s) => `${s}\t0\treports/${s}.txt\tv5\tpython3 ${s}.py`).join("\n");
const allPass = (report) => (report.includes("behavior-core.txt") ? spec(306) : report.includes("r11-memory") ? spec(60) : "ok");

test("buildRows reports one row per suite with the required fields", () => {
  const rows = buildRows({
    tsv: `${tsvFor(EXPECTED_SUITES.filter((s) => s !== "behavior-core" && s !== "r11-memory"))}\nbehavior-core\t0\treports/behavior-core.txt\tv5/behavior-core\tnode --test tests/*.test.mjs\nr11-memory\t0\treports/r11-memory.txt\tr11\tnode --test memory/tests/*.test.mjs`,
    readReport: allPass,
    scratch: SCRATCH,
    exists: () => true,
  });
  const core = rows.find((r) => r.suite === "behavior-core");
  assert.deepEqual(
    { ...core },
    { suite: "behavior-core", command: nodeTest, exit_code: 0, status: "PASS", tests: 306, report: "reports/behavior-core.txt", gating: true },
  );
  assert.equal(rows.find((r) => r.suite === "r11-memory").tests, 60);
  assert.equal(shouldFailJob(rows), false);
});

test("check_acceptance.py and every Playwright check are NOT_RUN with a reason and never fail the job", () => {
  const rows = buildRows({ tsv: tsvFor(EXPECTED_SUITES), readReport: () => "ok", scratch: SCRATCH, exists: () => true });
  const notRun = rows.filter((r) => r.status === "NOT_RUN");
  assert.equal(notRun.length, 7);
  for (const r of notRun) {
    assert.ok(r.reason.length > 0, r.suite);
    assert.equal(r.exit_code, null);
    assert.equal(r.report, null);
  }
  assert.deepEqual(NOT_RUN_SUITES.map((s) => s.suite).sort(), [
    "r11-agents-checks",
    "r11-browser-checks",
    "r11-meeting-checks",
    "r11-memory-browser-checks",
    "r11-onboarding-browser-checks",
    "r11-orb-checks",
    "v5-check-acceptance",
  ]);
});

test("a FAIL in a gating suite fails the job; PRECONDITION_MISSING and NOT_RUN do not", () => {
  const tsv = tsvFor(EXPECTED_SUITES).replace("r11-geometry-checks\t0", "r11-geometry-checks\t1");
  const missing = buildRows({
    tsv,
    readReport: (report) => (report.includes("geometry") ? `Cannot find module '${SCRATCH}/v5/x.js'` : "ok"),
    scratch: SCRATCH,
    exists: () => false,
  });
  assert.equal(missing.find((r) => r.suite === "r11-geometry-checks").status, "PRECONDITION_MISSING");
  assert.equal(shouldFailJob(missing), false);

  const failed = buildRows({
    tsv,
    readReport: (report) => (report.includes("geometry") ? "AssertionError" : "ok"),
    scratch: SCRATCH,
    exists: () => false,
  });
  assert.equal(failed.find((r) => r.suite === "r11-geometry-checks").status, "FAIL");
  assert.equal(shouldFailJob(failed), true);
});

test("check_hindsight_package.py is reported as FAIL but does not gate the job", () => {
  const tsv = tsvFor(EXPECTED_SUITES).replace("v5-check-hindsight-package\t0", "v5-check-hindsight-package\t1");
  const rows = buildRows({ tsv, readReport: () => "10 errors", scratch: SCRATCH, exists: () => false });
  const row = rows.find((r) => r.suite === "v5-check-hindsight-package");
  assert.equal(row.status, "FAIL");
  assert.equal(row.gating, false);
  assert.match(row.reason, /M2-0385/);
  assert.equal(shouldFailJob(rows), false);
});

test("an expected suite with no row, a missing report or a bad exit code is FAIL", () => {
  const rows = buildRows({ tsv: "r11-memory\t0\treports/r11-memory.txt\tr11\tx", readReport: () => null, scratch: SCRATCH });
  assert.equal(rows.find((r) => r.suite === "r11-memory").status, "FAIL");
  assert.match(rows.find((r) => r.suite === "r11-memory").reason, /missing/);
  assert.match(rows.find((r) => r.suite === "behavior-core").reason, /did not run/);
  const bad = buildRows({ tsv: "r11-memory\tabc\treports/r11-memory.txt\tr11\tx", readReport: () => "ok", scratch: SCRATCH });
  assert.equal(bad.find((r) => r.suite === "r11-memory").status, "FAIL");
  assert.equal(shouldFailJob(bad), true);
});

test("renderMarkdown lists every row and the result", () => {
  const rows = buildRows({ tsv: tsvFor(EXPECTED_SUITES), readReport: () => "ok", scratch: SCRATCH, exists: () => true });
  const md = renderMarkdown(rows);
  for (const r of rows) assert.ok(md.includes(`| ${r.suite} |`), r.suite);
  assert.match(md, /Result:/);
});
