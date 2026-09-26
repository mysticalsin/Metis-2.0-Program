'use strict'
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript')
const root = path.resolve(__dirname, '..')
function load(relative, extra = {}, stage = 'overlay') {
  const base = stage === 'overlay' && process.env.METIS_SOURCE_ROOT
    ? process.env.METIS_SOURCE_ROOT : path.join(root, stage)
  let filename = path.join(base, relative)
  if (!/\.(tsx?|mjs|cjs|js)$/.test(filename)) filename += '.ts'
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, strict: true}, fileName: filename, reportDiagnostics: true
  })
  const errors=result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error)
  if (errors.length) throw Error(ts.formatDiagnosticsWithColorAndContext(errors,{
    getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=>'\n'
  }))
  const mod={exports:{}}
  const localRequire=id=>{
    if(Object.hasOwn(extra,id))return extra[id]
    if(id.startsWith('.')){
      const rel=path.posix.normalize(path.posix.join(path.posix.dirname(relative),id))
      return load(rel,extra,stage)
    }
    return require(id)
  }
  vm.runInThisContext(`(function(require,module,exports){${result.outputText}\n})`,{filename})(
    localRequire,mod,mod.exports)
  return mod.exports
}
module.exports={load}
