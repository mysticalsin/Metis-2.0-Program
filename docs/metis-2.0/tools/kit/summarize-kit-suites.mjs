#!/usr/bin/env node
// Summarizes the per-suite reports written by run-kit-suites.sh into summary.json and summary.md (M2-0449).
//
//   node summarize-kit-suites.mjs --out <dir> --scratch <dir>
//
// <dir>/suites.tsv has one tab-separated row per executed suite: suite, exit_code, report, cwd, command.
// cwd is relative to the scratch directory. <dir>/<report> holds that suite's stdout, stderr and exit code.
// Suites that are never executed (NOT_RUN_SUITES below) are added here with a reason.
// Exit code 1 when any gating suite is FAIL.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Extensions listed as "not in whitelist" in docs/metis-2.0/kit/README.md ("Excluded, and why"). The "(none)" row is
// left out on purpose: an extensionless name (a bare module such as `typescript`) does not identify a kit file that
// the text-only copy dropped. summarize-kit-suites.test.mjs checks this list against the README table.
export const EXCLUDED_EXTENSIONS = [
  ".command", ".css", ".csv", ".dot", ".example", ".gif", ".jpeg", ".js", ".jsonl", ".log", ".mmd",
  ".mp4", ".patch", ".pdf", ".png", ".svg", ".tap", ".tsx", ".yaml", ".zip",
];

// Floors: fewer tests than this means a test file was silently skipped (306 and 60 are the M2-0019 scratch counts,
// docs/metis-2.0/kit/PORT-DECISIONS.md "Verification").
export const MIN_TESTS = { "behavior-core": 306, "r11-memory": 60 };

// Reported, never gating: check_hindsight_package.py had 10 errors in the M2-0019 scratch run and is M2-0385's step.
export const NON_GATING = {
  "v5-check-hindsight-package": "reported only; its gate stays M2-0385's step",
};

// Suites that must appear in suites.tsv. A missing row is a FAIL, not a silent omission.
export const EXPECTED_SUITES = [
  "behavior-core-tsc",
  "behavior-core",
  "v5-negative-controls",
  "v5-jev-negative-controls",
  "v5-check-hindsight-package",
  "r11-memory",
  "r11-onboarding-policy",
  "r11-dual-agent-checks",
  "r11-negative-checks",
  "r11-agent-contract-checks",
  "r11-geometry-checks",
  "r11-onboarding-validate-package",
];

const NO_BROWSER = "Playwright and Chromium are not installed; this workflow never executes browser checks";
export const NOT_RUN_SUITES = [
  {
    suite: "v5-check-acceptance",
    command: "python3 tools/check_acceptance.py --report <trusted native acceptance report> --commit <sha> --artifact <built artifact> --platform <platform>",
    reason: "needs a trusted native acceptance report and built artifact; none exists",
  },
  ...[
    ["r11-browser-checks", "verification/browser_checks.py"],
    ["r11-agents-checks", "verification/agents_checks.py"],
    ["r11-meeting-checks", "verification/meeting_checks.py"],
    ["r11-memory-browser-checks", "verification/memory_browser_checks.py"],
    ["r11-orb-checks", "verification/orb_checks.py"],
    ["r11-onboarding-browser-checks", "onboarding/verification/browser_checks.py"],
  ].map(([suite, file]) => ({ suite, command: `python3 ${file}`, reason: NO_BROWSER })),
];

// `node --test` prints "ℹ tests N" (spec reporter) or "# tests N" (TAP); the last match is the run total.
export function parseTestCount(text) {
  const matches = [...text.matchAll(/^(?:ℹ|#) tests (\d+)\s*$/gm)];
  return matches.length ? Number(matches[matches.length - 1][1]) : null;
}

// File names that Node and Python error messages report as missing.
const MISSING_PATTERNS = [
  /Cannot find module '([^']+)'/g,
  /ENOENT[^\n]*?'([^']+)'/g,
  /No such file or directory: '([^']+)'/g,
  /can't open file '([^']+)'/g,
];

export function missingPaths(text) {
  const found = new Set();
  for (const pattern of MISSING_PATTERNS) {
    for (const match of text.matchAll(pattern)) found.add(match[1]);
  }
  return [...found];
}

const isExcludedExtension = (file) => EXCLUDED_EXTENSIONS.includes(path.extname(file).toLowerCase());
const isInside = (root, file) => file.startsWith(root.endsWith(path.sep) ? root : root + path.sep);

// cwd is the suite's absolute working directory; exists(absolutePath) reports whether the path is in the scratch copy.
export function classifySuite({ suite, command, exitCode, output, scratch, cwd, exists = fs.existsSync }) {
  const tests = parseTestCount(output);
  if (exitCode === 0) {
    if (/(^|\s)--test(\s|$)/.test(command)) {
      if (!tests) return { status: "FAIL", tests: 0, reason: "node --test reported zero tests" };
      const floor = MIN_TESTS[suite];
      if (floor !== undefined && tests < floor) {
        return { status: "FAIL", tests, reason: `${tests} tests is below the ${floor} floor; a test file was skipped` };
      }
    }
    return { status: "PASS", tests, reason: null };
  }
  const absent = missingPaths(output)
    .map((file) => path.resolve(cwd, file))
    .filter((file) => !exists(file));
  const excluded = absent.length > 0 && absent.every((file) => isInside(scratch, file) && isExcludedExtension(file));
  if (excluded) {
    const names = absent.map((file) => path.relative(scratch, file)).join(", ");
    return { status: "PRECONDITION_MISSING", tests, reason: `absent from the text-only kit copy (extension excluded by kit/README.md): ${names}` };
  }
  return { status: "FAIL", tests, reason: null };
}

export function buildRows({ tsv, readReport, scratch, exists }) {
  const rows = [];
  const seen = new Set();
  for (const line of tsv.split("\n").filter((l) => l.trim() !== "")) {
    const [suite, exitText, report, cwd, ...commandParts] = line.split("\t");
    const command = commandParts.join("\t");
    seen.add(suite);
    const exitCode = Number(exitText);
    const output = readReport(report);
    let result;
    if (output === null || !Number.isInteger(exitCode)) {
      result = {
        status: "FAIL",
        tests: null,
        reason: output === null ? `report ${report} is missing` : `exit code ${JSON.stringify(exitText)} is not an integer`,
      };
    } else {
      result = classifySuite({ suite, command, exitCode, output, scratch, cwd: path.resolve(scratch, cwd), exists });
    }
    const reason = result.reason ?? (result.status === "FAIL" ? NON_GATING[suite] ?? null : null);
    rows.push({
      suite,
      command,
      exit_code: Number.isInteger(exitCode) ? exitCode : null,
      status: result.status,
      tests: result.tests,
      report,
      gating: !(suite in NON_GATING),
      ...(reason ? { reason } : {}),
    });
  }
  for (const suite of EXPECTED_SUITES) {
    if (!seen.has(suite)) {
      rows.push({
        suite, command: null, exit_code: null, status: "FAIL", tests: null, report: null, gating: true,
        reason: "suite did not run (no row in suites.tsv)",
      });
    }
  }
  for (const { suite, command, reason } of NOT_RUN_SUITES) {
    rows.push({ suite, command, exit_code: null, status: "NOT_RUN", tests: null, report: null, gating: false, reason });
  }
  return rows;
}

export const shouldFailJob = (rows) => rows.some((row) => row.status === "FAIL" && row.gating);

export function renderMarkdown(rows) {
  const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
  const lines = [
    "## Kit suites",
    "",
    "| suite | status | tests | exit | note |",
    "|---|---|---|---|---|",
    ...rows.map((r) => `| ${cell(r.suite)} | ${r.status} | ${cell(r.tests)} | ${cell(r.exit_code)} | ${cell(r.reason)} |`),
    "",
    shouldFailJob(rows) ? "Result: FAIL (a gating suite failed)" : "Result: no gating suite failed",
    "",
  ];
  return lines.join("\n");
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const out = arg("--out");
  const scratch = arg("--scratch");
  if (!out || !scratch) {
    console.error("usage: summarize-kit-suites.mjs --out <dir> --scratch <dir>");
    return 2;
  }
  const tsvPath = path.join(out, "suites.tsv");
  const tsv = fs.existsSync(tsvPath) ? fs.readFileSync(tsvPath, "utf8") : "";
  const readReport = (report) => {
    const file = path.join(out, report);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  };
  const rows = buildRows({ tsv, readReport, scratch: path.resolve(scratch) });
  fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(rows, null, 2) + "\n");
  const markdown = renderMarkdown(rows);
  fs.writeFileSync(path.join(out, "summary.md"), markdown);
  process.stdout.write(markdown);
  return shouldFailJob(rows) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
