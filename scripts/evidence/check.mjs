#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const REQUIRED_TICKETS = ['M2-0093', 'M2-0094', 'M2-0100', 'M2-0114', 'M2-0117', 'M2-0130', 'M2-0137', 'M2-0158', 'M2-0160']
const REQUIRED_VARIANTS = ['light-1x', 'dark-1x', 'light-2x', 'dark-2x', 'reduced-motion']

function file(path) {
  return readFileSync(path, 'utf8')
}

function hasAnyCapture(ticketDir) {
  return REQUIRED_VARIANTS.every((variant) => {
    const png = join(ticketDir, 'screenshots', `${variant}.png`)
    const webm = join(ticketDir, 'recordings', `${variant}.webm`)
    return existsSync(png) || existsSync(webm)
  })
}

function checkM20201(root) {
  const problems = []
  const base = join(root, 'docs/metis-2.0/design/M2-0201')
  const manifestPath = join(base, 'manifest.json')
  const validationPath = join(base, 'VALIDATION.md')
  const readmePath = join(base, 'README.md')
  const rendererPath = join(root, 'src/renderer/src/components/M2DesignPrototypes.tsx')
  const rendererCssPath = join(root, 'src/renderer/src/components/M2DesignPrototypes.css')
  const rendererEntryPath = join(root, 'src/renderer/m2-design.html')

  for (const path of [manifestPath, validationPath, readmePath, rendererPath, rendererCssPath, rendererEntryPath]) {
    if (!existsSync(path)) problems.push(`missing required file: ${path}`)
  }
  if (problems.length > 0) return problems

  const manifest = JSON.parse(file(manifestPath))
  const validation = file(validationPath)
  const readme = file(readmePath)
  const renderer = file(rendererPath)

  if (manifest.ticket !== 'M2-0201') problems.push('manifest ticket must be M2-0201')
  if (manifest.evidence_level !== 'DESIGNED') problems.push('manifest evidence_level must be DESIGNED')
  if (!Array.isArray(manifest.variants) || REQUIRED_VARIANTS.some((v) => !manifest.variants.includes(v))) {
    problems.push(`manifest variants must include ${REQUIRED_VARIANTS.join(', ')}`)
  }
  if (!Array.isArray(manifest.prototypes) || manifest.prototypes.length !== REQUIRED_TICKETS.length) {
    problems.push('manifest must list all nine prototypes')
  }
  for (const ticket of REQUIRED_TICKETS) {
    const entry = manifest.prototypes?.find((p) => p.ticket === ticket)
    const ticketDir = join(base, ticket)
    const statePath = join(ticketDir, 'STATE-LIST.md')
    if (!entry) problems.push(`manifest missing ${ticket}`)
    if (!existsSync(statePath)) problems.push(`${ticket}: missing STATE-LIST.md`)
    if (existsSync(statePath)) {
      const state = file(statePath)
      for (const phrase of ['Keyboard path:', 'Kit sections satisfied:', 'Reduced motion']) {
        if (!state.includes(phrase)) problems.push(`${ticket}: STATE-LIST.md missing ${phrase}`)
      }
    }
    if (!hasAnyCapture(ticketDir)) problems.push(`${ticket}: missing renderer-captured PNG or WEBM for every required variant`)
    if (!renderer.includes(ticket)) problems.push(`renderer component does not include ${ticket}`)
  }

  if (!validation.includes('Independent Opus validator acceptance') || !validation.includes('ACCEPTED')) {
    problems.push('VALIDATION.md must include an independent Opus validator ACCEPTED entry')
  }
  if (validation.includes('BLOCKED_EXTERNAL')) {
    problems.push('VALIDATION.md must not leave Opus validation as BLOCKED_EXTERNAL')
  }
  if (readme.includes('not product runtime evidence')) {
    problems.push('README.md still describes screenshot matrices as not product runtime evidence')
  }
  return problems
}

const { values } = parseArgs({ options: { ticket: { type: 'string' } } })
if (values.ticket !== 'M2-0201') {
  console.error('Only --ticket M2-0201 is supported in this worktree evidence checker.')
  process.exit(2)
}

const problems = checkM20201(process.cwd())
if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  process.exit(1)
}

console.log('M2-0201 evidence check passed')
