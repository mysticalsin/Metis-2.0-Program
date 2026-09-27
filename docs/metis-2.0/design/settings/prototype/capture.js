/* Capture harness for the Settings 2.0 design evidence (M2-0101). First open
   about:blank#<absolute path of this checkout's docs/metis-2.0/design/settings/ folder, ending in a slash>
   in the shared tab, then run this file with the Playwright MCP tool browser_run_code_unsafe
   ({ filename: <this file> }). The harness takes its root from that fragment and never navigates the shared
   page: every capture runs in its own browser context, and the prototype is served from disk through a
   routed origin. Output: docs/metis-2.0/evidence/M2-0101/design/<state>/<theme>-<scale>x-<motion>.png. The
   function returns every capture's audit, a negative control and the interaction checks, which the caller
   writes to audit.json. */
async (page) => {
  const ROOT = decodeURIComponent(page.url().split('#')[1] ?? '')
  if (!ROOT.endsWith('/design/settings/')) {
    throw new Error('Open about:blank#<absolute path of docs/metis-2.0/design/settings/> in the shared tab first.')
  }
  const OUT = ROOT + '../../evidence/M2-0101/design/'
  const ORIGIN = 'http://settings-prototype.local/'
  const MAX_TRANSITION_MS = 200
  const browser = page.context().browser()

  const open = async (options) => {
    const context = await browser.newContext(options)
    const tab = await context.newPage()
    await tab.route(ORIGIN + '**', (route) =>
      route.fulfill({ path: ROOT + route.request().url().slice(ORIGIN.length).split('?')[0] }))
    return { context, tab }
  }

  const listing = await open({})
  await listing.tab.goto(ORIGIN + 'prototype/index.html')
  await listing.tab.waitForSelector('#app[data-ready="true"]')
  const states = await listing.tab.evaluate(() =>
    window.SETTINGS_STATES.map((s) => ({ id: s.id, title: s.title, viewport: s.viewport ?? { width: 880, height: 800 } })))
  await listing.context.close()

  const captures = []
  let motionShot = null
  for (const state of states) {
    for (const theme of ['light', 'dark']) {
      for (const scale of [1, 2]) {
        for (const motion of ['no-preference', 'reduce']) {
          const { context, tab } = await open({
            viewport: state.viewport, deviceScaleFactor: scale, colorScheme: theme, reducedMotion: motion
          })
          const errors = []
          tab.on('pageerror', (e) => errors.push(String(e)))
          await tab.goto(`${ORIGIN}prototype/index.html?state=${state.id}`)
          await tab.waitForSelector('#app[data-ready="true"]')
          await tab.evaluate(() => document.fonts.ready)
          await tab.waitForFunction(() => document.getAnimations().length === 0, null, { timeout: 2000 })
          await tab.addScriptTag({ path: ROOT + 'prototype/audit.js' })
          const audit = await tab.evaluate((opts) => window.auditSettingsPrototype(opts),
            { reducedMotion: motion === 'reduce', maxTransitionMs: MAX_TRANSITION_MS })
          // A reduced-motion capture that is byte-identical to its full-motion twin is recorded against that
          // file instead of being stored twice: at rest the two differ only in transitions, which the motion
          // audit measures.
          let file = `${state.id}/${theme}-${scale}x-${motion === 'reduce' ? 'reduced-motion' : 'motion'}.png`
          if (motion === 'reduce' && (await tab.screenshot()).equals(motionShot)) file = captures[captures.length - 1].file
          else {
            const shot = await tab.screenshot({ path: OUT + file })
            if (motion !== 'reduce') motionShot = shot
          }
          captures.push({ state: state.id, title: state.title, theme, scale, motion, viewport: state.viewport, file, errors, audit })
          await context.close()
        }
      }
    }
  }
  // Negative control: the audit must fail on known defects, or its passes above prove nothing.
  const { context, tab } = await open({ viewport: { width: 880, height: 800 }, colorScheme: 'dark' })
  await tab.goto(`${ORIGIN}prototype/index.html?state=S02-voice-ready`)
  await tab.waitForSelector('#app[data-ready="true"]')
  await tab.addScriptTag({ path: ROOT + 'prototype/audit.js' })
  const negativeControl = await tab.evaluate((maxTransitionMs) => {
    document.querySelector('[data-control="voice.microphone"] select option').text = 'System default (MacBook Pro Microphone)'
    document.querySelector('.dest-summary').style.color = '#4a3a60'
    Object.assign(document.querySelector('.toggle').style, { borderColor: '#2a1048', backgroundColor: 'transparent' })
    Object.assign(document.querySelector('.row .label').style, { whiteSpace: 'nowrap', overflow: 'hidden', width: '40px' })
    document.querySelector('.content').style.transition = 'opacity 400ms'
    const audit = window.auditSettingsPrototype({ reducedMotion: false, maxTransitionMs })
    return {
      injected: ['low-contrast summary text', 'toggle edge without contrast', 'clipped label', 'clipped select text', '400 ms transition'],
      pass: audit.pass, text: audit.text.failures, nonText: audit.nonText.failures, clipping: audit.clipping.failures, motion: audit.motion.failures
    }
  }, MAX_TRANSITION_MS)
  await context.close()

  // Keyboard and task paths of §11, driven through the accessibility tree.
  const flow = await open({ viewport: { width: 880, height: 800 } })
  const t = flow.tab
  const read = (fn) => t.evaluate(fn)
  await t.goto(`${ORIGIN}prototype/index.html?state=S02-voice-ready`)
  await t.waitForSelector('#app[data-ready="true"]')
  const interactions = []
  const check = (name, actual, expected) => interactions.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) })
  await t.getByRole('radio', { name: 'Local speech on this device' }).click()
  check('local route without a pack opens Optional local speech instead of switching',
    await read(() => [document.querySelector('.row.highlight')?.dataset.control, !!document.querySelector('[role=alertdialog]')]),
    ['voice.local-speech-packs', false])
  await t.keyboard.press('Meta+f')
  await t.keyboard.type('reten')
  await t.keyboard.press('Enter')
  check('Cmd+F, type, Enter lands on the control and focuses it',
    await read(() => [document.getElementById('dest-title').textContent, document.activeElement.getAttribute('aria-label')]),
    ['Privacy & account', 'Delete meetings after'])
  await t.getByRole('combobox', { name: 'Delete meetings after' }).selectOption({ label: '90 days' })
  await t.getByRole('button', { name: 'Cancel' }).click()
  check('a consequential change asks first and Cancel keeps the value',
    await read(() => document.querySelector('[data-control="privacy.retention"] select').selectedOptions[0].text), 'Never')
  await t.getByRole('combobox', { name: 'Delete meetings after' }).selectOption({ label: '90 days' })
  await t.getByRole('button', { name: 'Change' }).click()
  check('confirmed change is saved and says so',
    await read(() => [document.querySelector('[data-control="privacy.retention"] select').selectedOptions[0].text,
      document.querySelector('[data-control="privacy.retention"] .status').textContent]), ['90 days', 'Saved'])
  await t.getByRole('button', { name: 'Voice & meetings' }).click()
  await t.getByRole('switch', { name: 'Show the live transcript' }).click()
  check('a reversible preference applies at once',
    await read(() => document.querySelector('[data-control="voice.live-transcript"] .toggle').getAttribute('aria-checked')), 'true')
  await t.goto(`${ORIGIN}prototype/index.html?state=S13-save-failed`)
  await t.waitForSelector('#app[data-ready="true"]')
  await t.getByRole('switch', { name: 'Suggest replies automatically' }).click()
  check('a failed save keeps the confirmed value on screen and explains it',
    await read(() => [document.querySelector('[data-control="voice.auto-answer"] .toggle').getAttribute('aria-checked'),
      document.querySelector('[data-control="voice.auto-answer"] [role=alert]')?.textContent.startsWith('Couldn’t save.')]), ['true', true])
  await flow.context.close()
  return { captures, negativeControl, interactions }
}
