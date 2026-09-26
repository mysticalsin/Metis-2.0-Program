#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript')
const root = path.resolve(__dirname, '..')
let count = 0, failures = 0
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) visit(file)
    else if (/\.tsx?$/.test(file)) {
      count++
      const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: file, reportDiagnostics: true,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, strict: true }
      })
      for (const diagnostic of out.diagnostics || []) {
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          failures++; console.error(file, ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
        }
      }
    }
  }
}
visit(path.join(root, 'overlay'))
console.log(`TypeScript transpilation/syntax: ${count} files, ${failures} diagnostics. Not project-level typechecking.`)
process.exit(failures ? 1 : 0)
