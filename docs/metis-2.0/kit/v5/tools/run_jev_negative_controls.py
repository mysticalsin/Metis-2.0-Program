#!/usr/bin/env python3
"""Fault injection in TEMP compiled copies, with unchanged tests. No vendor calls."""
from pathlib import Path
import json, re, shutil, subprocess, tempfile
BASE = Path(__file__).resolve().parents[1]
CORE = BASE / 'behavior-core'
MUTATIONS = [
 ('consume-selected-not-first', 'jev-consumer.js',
  'const selected = candidates.find(c => c.id === answer.choice);',
  'const selected = candidates[0];'),
 ('respect-choice-confidence', 'jev-consumer.js',
  'answer.choice === CLARIFY || !acceptedChoice(answer, result.thresholds)',
  'answer.choice === CLARIFY'),
 ('reject-model-drift', 'jev-contract.js',
  "requireThat(raw.model === expectedModel, 'DECISION_MODEL_DRIFT');", '// deliberately removed model fence'),
 ('recheck-after-response', 'jev-service.js',
  "await wait(this.ports.security.assertCurrent(request, policy, provider, 'after_response'));", '// deliberately removed revocation check'),
 ('recheck-before-release', 'jev-service.js',
  "await wait(this.ports.security.assertCurrent(request, policy, provider, 'before_return'));", '// deliberately removed final ACL fence'),
 ('unknown-is-not-zero', 'jev-contract.js',
  "const inputTokens = count(x.input_tokens), outputTokens = count(x.output_tokens);",
  "const inputTokens = count(x.input_tokens) ?? 0, outputTokens = count(x.output_tokens) ?? 0;"),
 ('persist-selection-before-effect', 'jev-consumer.js',
  'await within(options.recordConsumption(decision), signal, 2000);', '// deliberately ignored settlement'),
 ('honor-configured-laya-route', 'jev-service.js',
  "const primary = policy.mode === 'auto' ? policy.primary : policy.mode;", "const primary = 'jev';"),
]
def main():
 results = []
 for name, filename, old, new in MUTATIONS:
  with tempfile.TemporaryDirectory(prefix='metis-jev-negative-') as tmp:
   root = Path(tmp) / 'core'
   shutil.copytree(CORE, root)
   file = root / 'dist' / filename
   text = file.read_text()
   if old not in text:
    raise RuntimeError(f'Mutation anchor missing: {name}')
   file.write_text(text.replace(old, new, 1))
   run = subprocess.run(['node', '--test', *map(str, sorted((root/'tests').glob('*.test.mjs')))], cwd=root, text=True, capture_output=True, timeout=30)
   def count(key):
    match = re.search(r'^# '+key+r' (\d+)\s*$', run.stdout, re.M)
    return int(match[1]) if match else None
   result = {'id':name,'exit_code':run.returncode,'tests':count('tests'),'passed':count('pass'),'failed':count('fail'),'detected':run.returncode!=0 and (count('fail') or 0)>0}
   results.append(result)
   print(name, result['detected'], result['failed'])
 output = {'scope':'Temporary compiled candidates, unchanged synthetic/loopback tests; not independent review or universal safety proof','controls':results,'all_detected':all(x['detected'] for x in results)}
 (BASE/'jev/evidence/negative-controls.json').write_text(json.dumps(output,indent=2)+'\n')
 if not output['all_detected']:
  raise SystemExit('A negative control escaped detection')
if __name__ == '__main__':
 main()
