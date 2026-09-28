#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { _electron as electron } from 'playwright'

const REQUIRED_TICKETS = ['M2-0093', 'M2-0094', 'M2-0100', 'M2-0114', 'M2-0117', 'M2-0130', 'M2-0137', 'M2-0158', 'M2-0160']
const REQUIRED_VARIANTS = ['light-1x', 'dark-1x', 'light-2x', 'dark-2x', 'reduced-motion']
const CAPTURE_MODE = 'electron-vite-renderer-capture'
const CAPTURE_TOOL = 'playwright-electron'
const CAPTURE_RUNTIME = 'electron'
const SOURCE_FILES = [
  'src/renderer/m2-design.html',
  'src/renderer/src/m2-design-entry.tsx',
  'src/renderer/src/components/M2DesignPrototypes.tsx',
  'src/renderer/src/components/M2DesignPrototypes.css'
]

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function pngTextChunk(keyword, value) {
  const data = Buffer.from(`${keyword}\0${value}`, 'latin1')
  const type = Buffer.from('tEXt')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = crc32(Buffer.concat([type, data]))
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc >>> 0)
  return Buffer.concat([length, type, data, checksum])
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function addPngText(path, chunks) {
  const bytes = readFileSync(path)
  const iend = bytes.lastIndexOf(Buffer.from('IEND'))
  if (iend < 0) throw new Error(`${path}: missing IEND chunk`)
  const insertAt = iend - 4
  writeFileSync(path, Buffer.concat([bytes.subarray(0, insertAt), ...chunks, bytes.subarray(insertAt)]))
}

const root = resolve(process.env.M2_DESIGN_ROOT ?? process.cwd())
const base = join(root, 'docs/metis-2.0/design/M2-0201')
const url = process.env.M2_DESIGN_URL
if (!url) {
  throw new Error('Set M2_DESIGN_URL to the CI-served Electron/Vite renderer URL for src/renderer/m2-design.html')
}

const sourceFiles = Object.fromEntries(SOURCE_FILES.map((path) => [path, sha256(join(root, path))]))
const electronMain = join(mkdtempSync(join(tmpdir(), 'm2-design-electron-')), 'main.cjs')
writeFileSync(
  electronMain,
  `
const { app, BrowserWindow } = require('electron')

const url = process.env.M2_DESIGN_URL
if (!url) throw new Error('M2_DESIGN_URL is required')

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    backgroundColor: '#f7f8fb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  await win.loadURL(url)
})
`
)

const electronApp = await electron.launch({ args: [electronMain] })
const electronVersion = await electronApp.evaluate(({ process }) => process.versions.electron)
const page = await electronApp.firstWindow()
await page.setViewportSize({ width: 1280, height: 900 })
await page.waitForLoadState('networkidle')
const userAgent = await page.evaluate(() => navigator.userAgent)
if (!userAgent.includes('Electron/')) {
  throw new Error(`Expected Electron renderer user agent, got: ${userAgent}`)
}

const artifacts = []
for (const ticket of REQUIRED_TICKETS) {
  for (const variant of REQUIRED_VARIANTS) {
    const selector = `[data-ticket="${ticket}"][data-variant="${variant}"]`
    const node = page.locator(selector)
    await node.waitFor({ state: 'visible', timeout: 10_000 })
    const path = join(base, ticket, 'screenshots', `${variant}.png`)
    mkdirSync(dirname(path), { recursive: true })
    await node.screenshot({ path })
    addPngText(path, [
      pngTextChunk('metis.ticket', ticket),
      pngTextChunk('metis.variant', variant),
      pngTextChunk('metis.source', 'src/renderer/src/components/M2DesignPrototypes.tsx'),
      pngTextChunk('metis.source_sha256', sourceFiles['src/renderer/src/components/M2DesignPrototypes.tsx']),
      pngTextChunk('metis.capture_mode', CAPTURE_MODE),
      pngTextChunk('metis.capture_tool', CAPTURE_TOOL),
      pngTextChunk('metis.runtime', CAPTURE_RUNTIME),
      pngTextChunk('metis.electron_version', electronVersion),
      pngTextChunk('metis.user_agent', userAgent)
    ])
    artifacts.push({
      ticket,
      variant,
      path: `${ticket}/screenshots/${variant}.png`,
      sha256: sha256(path),
      source: 'src/renderer/src/components/M2DesignPrototypes.tsx',
      source_sha256: sourceFiles['src/renderer/src/components/M2DesignPrototypes.tsx'],
      capture_mode: CAPTURE_MODE,
      capture_tool: CAPTURE_TOOL,
      runtime: CAPTURE_RUNTIME,
      electron_version: electronVersion,
      user_agent: userAgent
    })
  }
}

await electronApp.close()

writeFileSync(
  join(base, 'capture/provenance.json'),
  `${JSON.stringify({
    schema: 'metis.design.capture.provenance.v1',
    ticket: 'M2-0201',
    created_at: new Date().toISOString(),
    mode: CAPTURE_MODE,
    capture_tool: CAPTURE_TOOL,
    runtime: CAPTURE_RUNTIME,
    electron_version: electronVersion,
    user_agent: userAgent,
    source_files: sourceFiles,
    generator: 'scripts/evidence/capture-m2-design.mjs using Playwright Electron against a CI-served Electron/Vite renderer URL',
    artifacts
  }, null, 2)}\n`
)

console.log(`captured ${artifacts.length} M2-0201 renderer artifacts`)
