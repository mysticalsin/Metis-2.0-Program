#!/usr/bin/env bash
# Runs the kit v5 behavior-core and r11 proof suites in a scratch copy and saves one report per suite (M2-0449).
# Called from .github/workflows/kit-suites.yml. Needs RUNNER_TEMP. Never writes into the checkout: a non-empty
# `git status --porcelain` afterwards fails the script (exit 1). A suite that fails does not stop the script;
# summarize-kit-suites.mjs turns the reports into PASS / FAIL / PRECONDITION_MISSING / NOT_RUN.
set -uo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
KIT="$REPO/docs/metis-2.0/kit"
SCRATCH="$RUNNER_TEMP/kit-scratch"
OUT="$RUNNER_TEMP/kit-suites-out"
TYPESCRIPT_VERSION="5.9.3"

rm -rf "$SCRATCH" "$OUT"
mkdir -p "$SCRATCH/home" "$SCRATCH/tmp" "$SCRATCH/raw" "$SCRATCH/tools" "$OUT/reports" "$OUT/negative-controls"
cp -R "$KIT/v5" "$SCRATCH/v5"
cp -R "$KIT/r11" "$SCRATCH/r11"
# The kit ships stale negative-controls.json files; remove them so an uploaded copy was written by this run.
rm -f "$SCRATCH/v5/evidence/negative-controls.json" "$SCRATCH/v5/jev/evidence/negative-controls.json"

# M2-0190 isolation: every command below sees the scratch HOME and TMPDIR only.
export SCRATCH HOME="$SCRATCH/home" TMPDIR="$SCRATCH/tmp" PYTHONDONTWRITEBYTECODE=1
: > "$OUT/suites.tsv"

# run_suite <name> <cwd relative to $SCRATCH> <command string>: saves stdout, stderr and exit code to reports/<name>.txt.
run_suite() {
  local name="$1" cwd="$2" cmd="$3" code
  ( cd "$SCRATCH/$cwd" && bash -c "$cmd" ) > "$SCRATCH/raw/$name.out" 2> "$SCRATCH/raw/$name.err"
  code=$?
  {
    printf '$ %s\n(cwd: %s)\n--- stdout ---\n' "$cmd" "$cwd"
    cat "$SCRATCH/raw/$name.out"
    printf '\n--- stderr ---\n'
    cat "$SCRATCH/raw/$name.err"
    printf '\n--- exit_code: %s ---\n' "$code"
  } > "$OUT/reports/$name.txt"
  printf '%s\t%s\treports/%s.txt\t%s\t%s\n' "$name" "$code" "$name" "$cwd" "$cmd" >> "$OUT/suites.tsv"
  echo "$name: exit $code"
}

# TypeScript is installed under $SCRATCH/tools, never into the kit copy or the checkout.
( cd "$SCRATCH/tools" && npm install --no-audit --no-fund --ignore-scripts --save-exact "typescript@$TYPESCRIPT_VERSION" ) \
  > "$OUT/reports/typescript-install.txt" 2>&1 \
  || echo "typescript install failed, see reports/typescript-install.txt"
TSC="$SCRATCH/tools/node_modules/.bin/tsc"

{
  echo "node: $(node --version 2>&1)"
  echo "python3: $(python3 --version 2>&1)"
  echo "tsc: $("$TSC" --version 2>&1) (pinned $TYPESCRIPT_VERSION)"
  echo "HOME: $HOME"
  echo "TMPDIR: $TMPDIR"
  echo "SCRATCH: $SCRATCH"
} > "$OUT/environment.txt"
cat "$OUT/environment.txt"

run_suite behavior-core-tsc v5/behavior-core '"$SCRATCH/tools/node_modules/.bin/tsc" -p tsconfig.json'
run_suite behavior-core v5/behavior-core 'node --test tests/*.test.mjs'
run_suite v5-negative-controls v5 'python3 tools/run_negative_controls.py'
run_suite v5-jev-negative-controls v5 'python3 tools/run_jev_negative_controls.py'
run_suite v5-check-hindsight-package v5 'python3 tools/check_hindsight_package.py --root "$SCRATCH/v5"'
run_suite r11-memory r11/memory 'node --test tests/*.test.mjs'
run_suite r11-onboarding-policy r11 'node onboarding/verification/policy.test.cjs'
run_suite r11-dual-agent-checks r11 'python3 verification/dual_agent_checks.py'
run_suite r11-negative-checks r11 'python3 verification/negative_checks.py'
run_suite r11-agent-contract-checks r11 'node verification/agent_contract_checks.cjs'
run_suite r11-geometry-checks r11 'node verification/geometry_checks.cjs'
run_suite r11-onboarding-validate-package r11 'python3 onboarding/verification/validate_package.py'

# The two negative-control tools write their result files inside their own (scratch) tree.
cp "$SCRATCH/v5/evidence/negative-controls.json" "$OUT/negative-controls/v5-negative-controls.json" 2>/dev/null || true
cp "$SCRATCH/v5/jev/evidence/negative-controls.json" "$OUT/negative-controls/v5-jev-negative-controls.json" 2>/dev/null || true

# Nothing may have been written into the checkout (kit dirs included).
git -C "$REPO" status --porcelain > "$OUT/git-status.txt"
if [ -s "$OUT/git-status.txt" ]; then
  echo "checkout is dirty after the run:"
  cat "$OUT/git-status.txt"
  exit 1
fi
echo "checkout is clean"
