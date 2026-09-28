#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { createHash } from 'node:crypto'

const REQUIRED_TICKETS = ['M2-0093', 'M2-0094', 'M2-0100', 'M2-0114', 'M2-0117', 'M2-0130', 'M2-0137', 'M2-0158', 'M2-0160']
const REQUIRED_VARIANTS = ['light-1x', 'dark-1x', 'light-2x', 'dark-2x', 'reduced-motion']
const MIN_PNG_BYTES = 12_000
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function file(path) {
  return readFileSync(path, 'utf8')
}

function readPngText(path) {
  const bytes = readFileSync(path)
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null
  const text = new Map()
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > bytes.length) return null
    if (type === 'tEXt') {
      const data = bytes.subarray(dataStart, dataEnd)
      const separator = data.indexOf(0)
      if (separator > 0) {
        text.set(data.subarray(0, separator).toString('latin1'), data.subarray(separator + 1).toString('latin1'))
      }
    }
    offset = dataEnd + 4
    if (type === 'IEND') break
  }
  return text
}

function hasBlockedStatus(label, content, problems) {
  if (content.includes('BLOCKED_EXTERNAL')) problems.push(`${label} must not contain BLOCKED_EXTERNAL for M2-0201 completion`)
  if (content.includes('LEAD_ACTION:')) problems.push(`${label} still contains lead-only completion steps`)
}

function captureProblem(base, ticket, variant, provenanceByPath, componentSha) {
  const ticketDir = join(base, ticket)
  const png = join(ticketDir, 'screenshots', `${variant}.png`)
  const webm = join(ticketDir, 'recordings', `${variant}.webm`)
  if (!existsSync(png) && !existsSync(webm)) return `${ticket}: missing renderer-captured PNG or WEBM for ${variant}`
  if (existsSync(webm)) return null
  const stat = statSync(png)
  if (stat.size < MIN_PNG_BYTES) return `${ticket}: ${variant}.png is too small to be a labeled renderer capture`
  const text = readPngText(png)
  if (!text) return `${ticket}: ${variant}.png is not a readable PNG`
  if (text.get('metis.ticket') !== ticket) return `${ticket}: ${variant}.png missing metis.ticket provenance`
  if (text.get('metis.variant') !== variant) return `${ticket}: ${variant}.png missing metis.variant provenance`
  if (text.get('metis.source') !== 'src/renderer/src/components/M2DesignPrototypes.tsx') {
    return `${ticket}: ${variant}.png missing renderer source provenance`
  }
  if (text.get('metis.source_sha256') !== componentSha) return `${ticket}: ${variant}.png renderer source hash is stale`
  if (!['renderer-spec-rasterization', 'electron-vite-renderer-capture'].includes(text.get('metis.capture_mode'))) {
    return `${ticket}: ${variant}.png missing supported capture mode provenance`
  }
  const relativePath = `${ticket}/screenshots/${variant}.png`
  const provenance = provenanceByPath.get(relativePath)
  if (!provenance) return `${ticket}: ${variant}.png missing capture/provenance.json entry`
  if (provenance.sha256 == null) return `${ticket}: ${variant}.png provenance entry missing sha256`
  if (provenance.sha256 !== cryptoSha256(readFileSync(png))) return `${ticket}: ${variant}.png provenance sha256 is stale`
  return null
}

function checkM20201(root) {
  const problems = []
  const base = join(root, 'docs/metis-2.0/design/M2-0201')
  const manifestPath = join(base, 'manifest.json')
  const validationPath = join(base, 'VALIDATION.md')
  const readmePath = join(base, 'README.md')
  const captureReadmePath = join(base, 'capture/README.md')
  const captureProvenancePath = join(base, 'capture/provenance.json')
  const captureScriptPath = join(root, 'scripts/evidence/capture-m2-design.mjs')
  const rendererPath = join(root, 'src/renderer/src/components/M2DesignPrototypes.tsx')
  const rendererCssPath = join(root, 'src/renderer/src/components/M2DesignPrototypes.css')
  const rendererEntryPath = join(root, 'src/renderer/m2-design.html')

  for (const path of [manifestPath, validationPath, readmePath, captureReadmePath, captureProvenancePath, captureScriptPath, rendererPath, rendererCssPath, rendererEntryPath]) {
    if (!existsSync(path)) problems.push(`missing required file: ${path}`)
  }
  if (problems.length > 0) return problems

  const manifest = JSON.parse(file(manifestPath))
  const provenance = JSON.parse(file(captureProvenancePath))
  const validation = file(validationPath)
  const readme = file(readmePath)
  const captureReadme = file(captureReadmePath)
  const renderer = file(rendererPath)
  const actualComponentSha = cryptoSha256(readFileSync(rendererPath))
  const provenanceByPath = new Map((provenance.artifacts ?? []).map((artifact) => [artifact.path, artifact]))

  if (manifest.ticket !== 'M2-0201') problems.push('manifest ticket must be M2-0201')
  if (manifest.evidence_level !== 'DESIGNED') problems.push('manifest evidence_level must be DESIGNED')
  if (provenance.ticket !== 'M2-0201') problems.push('capture/provenance.json ticket must be M2-0201')
  if (provenance.source_files?.['src/renderer/src/components/M2DesignPrototypes.tsx'] !== actualComponentSha) {
    problems.push('capture/provenance.json source hash for M2DesignPrototypes.tsx is stale')
  }
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
    for (const variant of REQUIRED_VARIANTS) {
      const problem = captureProblem(base, ticket, variant, provenanceByPath, actualComponentSha)
      if (problem) problems.push(problem)
    }
    if (!renderer.includes(ticket)) problems.push(`renderer component does not include ${ticket}`)
  }

  if (!validation.includes('Independent Opus validator acceptance') || !validation.includes('ACCEPTED')) {
    problems.push('VALIDATION.md must include an independent Opus validator ACCEPTED entry')
  }
  if (validation.includes('BLOCKED_EXTERNAL')) {
    problems.push('VALIDATION.md must not leave Opus validation as BLOCKED_EXTERNAL')
  }
  hasBlockedStatus('README.md', readme, problems)
  hasBlockedStatus('capture/README.md', captureReadme, problems)
  hasBlockedStatus('manifest.json', JSON.stringify(manifest), problems)
  hasBlockedStatus('capture/provenance.json', JSON.stringify(provenance), problems)
  return problems
}

function cryptoSha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
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
