'use strict'
// Compile the actual scoped TypeScript sources; no reimplementation of their logic.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript')
function load(relative, extra = {}, stage = process.env.METIS_SOURCE_STAGE || 'overlay') {
  if (!['baseline', 'overlay'].includes(stage)) throw Error('Unknown source stage')
  const base = process.env.METIS_SOURCE_ROOT || path.join(__dirname, '..', stage)
  const filename = path.join(base, relative)
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
    fileName: filename, reportDiagnostics: true
  })
  const errors = result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error)
  if (errors.length) throw Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: f => f, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n'
  }))
  const mod = { exports: {} }
  const localRequire = id => {
    if (Object.hasOwn(extra, id)) return extra[id]
    if (/\.(mp4|jpg|png)$/.test(id)) return { default: `/assets/${path.basename(id)}` }
    if (id.startsWith('.')) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), id))
      return load(target.endsWith('.ts') ? target : `${target}.ts`, extra, stage)
    }
    return require(id)
  }
  const factory = vm.runInThisContext(`(function(require, module, exports) {${result.outputText}\n})`, { filename })
  factory(localRequire, mod, mod.exports)
  return mod.exports
}
module.exports = { load }
