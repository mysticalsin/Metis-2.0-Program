#!/usr/bin/env node
'use strict'
// Run the bundled isolated regression tests. This deliberately does not claim CI,
// a full TypeScript project build, native packaging or external-service validation.
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
let repo
if (args.length) {
  if (args.length !== 2 || args[0] !== '--repo') {
    console.error('Usage: node tools/verify.cjs [--repo /absolute/checkout]'); process.exit(2)
  }
  repo = path.resolve(args[1])
}
let typescript
try {
  typescript = process.env.TYPESCRIPT_PATH || require.resolve('typescript', { paths: [repo || process.cwd(), root] })
} catch {
  console.error('TypeScript is required. Use the repository dependency installation or set TYPESCRIPT_PATH to its typescript module.'); process.exit(2)
}
const tests = fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.cjs')).sort().map(f => path.join(root, 'tests', f))
console.log(`ISOLATED REGRESSION RUN; Node ${process.version}. Repository engine target is 22.22.3.`)
console.log(repo ? 'Testing the supplied checkout sources using explicit isolated dependency fixtures.' : 'Testing the bundled overlay using explicit isolated dependency fixtures.')
const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: root, stdio: 'inherit', timeout: 120000,
  env: { ...process.env, TYPESCRIPT_PATH: typescript, METIS_SOURCE_STAGE: 'overlay', ...(repo ? { METIS_SOURCE_ROOT: repo } : {}) }
})
if (result.error) { console.error(result.error.message); process.exit(2) }
process.exit(result.status === 0 ? 0 : result.status || 2)
