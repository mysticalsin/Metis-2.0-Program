'use strict'
/* Settings 2.0 design prototype (M2-0101). Renders the four destinations, the Advanced drawer and search
   straight from ../inventory.json, so every control shown here is an inventoried control. Open it through a
   static server rooted at the settings design folder: prototype/?state=<state id> selects a design state. */

const INVENTORY_URL = '../inventory.json'
const params = new URLSearchParams(location.search)

const ICONS = {
  general: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  voice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  knowledge: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  privacy: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/>',
  advanced: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
}

function icon(name, label, cls) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.8')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  if (cls) svg.setAttribute('class', cls)
  if (label) svg.setAttribute('aria-label', label)
  else svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = ICONS[name]
  return svg
}

/** Create an element: props are attributes, except `class`, `text` and `on<Event>` handlers. */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue
    if (name === 'class') el.className = value
    else if (name === 'text') el.textContent = value
    else if (name.startsWith('on')) el.addEventListener(name.slice(2).toLowerCase(), value)
    else el.setAttribute(name, value === true ? '' : String(value))
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) el.append(child)
  return el
}

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** The declared predicates (`inventory.json › predicates`) that the mock evaluates, on example state: every
 *  `visible_when`, `offered_when` and `requires` id. The mock does not render `read_only_when`. */
const PREDICATES = {
  "overlayLayout == 'bar'": (m) => m.value('overlayLayout') === 'bar',
  "overlayPlacement == 'right-edge'": (m) => m.value('overlayPlacement') === 'right-edge',
  autoSuggest: (m) => m.value('autoSuggest') === true,
  "local route and asrEngine == 'whisper'": (m) => m.value('cloudSttProvider') === 'unconfigured' && m.value('asrEngine') === 'whisper',
  'brainConsolidation.enabled': (m) => m.value('brainConsolidation.enabled') === true,
  graphifyEnabled: (m) => m.value('graphifyEnabled') === true,
  "provider == 'custom'": (m) => m.value('provider') === 'custom',
  'localLlm.enabled': (m) => m.value('localLlm.enabled') === true,
  'a CLI is connected': () => false,
  'ssoBootstrapAllowed()': () => false,
  // The example policy lists no speech engines, sets no Soniox default or lock and applies no cloud-only
  // profile, so Cloudflare, local speech and the engine in force are allowed (SETTINGS-2.0.md §6); it seats
  // no Soniox key.
  'cloudflare allowed': () => true,
  'local allowed outside cloud-only': () => true,
  'soniox allowed': (m) => m.value('cloudSttProvider') === 'soniox',
  'verified local pack': (m) => m.state.speechPacks.some((p) => p.state === 'installed' || p.state === 'in-use'),
  'soniox key in force': () => false
}

function mergeState(base, patch = {}) {
  const out = { ...base, ...patch }
  for (const area of ['values', 'readiness', 'summaries']) out[area] = { ...base[area], ...(patch[area] ?? {}) }
  return out
}

function createModel(inventory, fixture) {
  const state = mergeState(window.SETTINGS_BASELINE, fixture.patch)
  const controls = new Map(inventory.controls.map((c) => [c.id, c]))
  const destinations = new Map(inventory.destinations.map((d) => [d.id, d]))
  const model = {
    inventory, state, controls, destinations,
    value: (key) => state.values[key],
    lock(control) {
      for (const key of control.keys) if (state.locks[key]) return state.locks[key]
      return null
    },
    visible(control) {
      if (!control.platforms.includes(state.platform)) return false
      if (state.hidden.includes(control.id)) return false
      const predicate = control.visible_when && PREDICATES[control.visible_when]
      return predicate ? predicate(model) : !control.visible_when
    },
    /** The option whose value (or `maps` of key values) matches the current state. */
    currentOption(control) {
      return (control.options ?? []).find((o) =>
        o.maps ? Object.entries(o.maps).every(([k, v]) => state.values[k] === v) : o.value === state.values[control.keys[0]]
      )
    },
    /** An option may be chosen while its `offered_when` holds; the option in force is shown regardless. */
    shownOption(control, option) {
      return !option.offered_when || PREDICATES[option.offered_when](model) || model.currentOption(control) === option
    },
    /** The reasons of the preconditions the option in force fails, with `<Org>` named. */
    unmetReasons(control) {
      const option = model.currentOption(control)
      if (!option) return []
      const org = state.organization?.name ?? 'your organization'
      return [['offered_when', 'not_offered'], ['requires', 'unavailable']]
        .filter(([test]) => option[test] && !PREDICATES[option[test]](model))
        .map(([, outcome]) => option[outcome].reason.replace('<Org>', org))
    },
    path(control) {
      const dest = destinations.get(control.destination)
      const group = dest.groups.find((g) => g.id === control.group)
      return `${dest.label} › ${group.label}`
    }
  }
  return model
}

/** Rank visible controls for a query: exact word or synonym, label prefix, word prefix, synonym, help text. */
function search(model, query) {
  const q = normalize(query.trim())
  if (!q) return []
  const hits = []
  for (const control of model.inventory.controls) {
    if (!model.visible(control)) continue
    const label = normalize(control.label)
    const synonym = control.synonyms.find((s) => normalize(s).includes(q))
    const exact = label.split(/\s+/).includes(q) || control.synonyms.some((syn) => normalize(syn) === q)
    let score = 0
    if (exact) score = 5
    else if (label.startsWith(q)) score = 4
    else if (label.split(/\s+/).some((w) => w.startsWith(q))) score = 3
    else if (synonym) score = 2
    else if (normalize(control.help).includes(q)) score = 1
    if (score) hits.push({ control, score, synonym })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8)
}

function createApp(root, inventory, fixture) {
  const model = createModel(inventory, fixture)
  const ui = {
    destination: fixture.destination,
    open: new Set(fixture.open ?? []),
    advancedOpen: fixture.destination === 'advanced',
    query: fixture.query ?? '',
    active: 0,
    highlight: null,
    statuses: new Map(),
    confirm: null,
    view: model.state.view
  }
  if (model.state.failed) {
    const { control, message, attempted } = model.state.failed
    ui.statuses.set(control, { kind: 'error', text: message, retry: attempted })
  }

  function commit(control, changes) {
    if (model.state.failed?.control === control.id) {
      ui.statuses.set(control.id, { kind: 'error', text: model.state.failed.message, retry: changes })
    } else {
      Object.assign(model.state.values, changes)
      ui.statuses.set(control.id, { kind: 'saved', text: 'Saved' })
    }
    render()
  }

  function request(control, changes) {
    if (control.apply === 'confirm') {
      ui.confirm = { control, changes }
      render()
    } else commit(control, changes)
  }

  /** Choosing an option whose `requires` fails never switches the value: it opens the control named by
   *  `unavailable.opens`, or else says why the option is unavailable. */
  function choose(control, option) {
    if (option.requires && !PREDICATES[option.requires](model)) {
      const { opens, reason } = option.unavailable
      if (opens) jump(model.controls.get(opens))
      else {
        ui.statuses.set(control.id, { kind: 'error', text: reason })
        render()
      }
      return
    }
    request(control, option.maps ?? { [control.keys[0]]: option.value })
  }

  function jump(control) {
    ui.destination = control.destination
    ui.advancedOpen = ui.advancedOpen || control.destination === 'advanced'
    const group = model.destinations.get(control.destination).groups.find((g) => g.id === control.group)
    if (group.disclosure) ui.open.add(`${control.destination}.${control.group}`)
    if (control.disclosure) ui.open.add(`more:${control.destination}.${control.group}`)
    ui.query = ''
    ui.highlight = control.id
    ui.view = 'detail'
    render()
    const row = root.querySelector(`[data-control="${control.id}"]`)
    row?.scrollIntoView({ block: 'center' })
    row?.querySelector('button, input, select')?.focus()
  }

  /** The search field is created once and never re-rendered, so typing keeps its caret and any IME
   *  composition; query changes only replace the results list. */
  const searchInput = h('input', {
    type: 'search', id: 'settings-search', role: 'combobox', 'aria-label': 'Search settings', placeholder: 'Search settings',
    'aria-expanded': 'false', 'aria-controls': 'search-results', 'aria-autocomplete': 'list', value: ui.query,
    onInput: (e) => {
      if (e.isComposing) return
      ui.query = e.target.value
      ui.active = 0
      updateResults()
    },
    onKeydown: (e) => {
      if (e.isComposing) return
      const results = search(model, ui.query)
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length) {
        e.preventDefault()
        ui.active = (ui.active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
        updateResults()
      } else if (e.key === 'Enter' && results[ui.active]) jump(results[ui.active].control)
      else if (e.key === 'Escape') {
        ui.query = ''
        searchInput.value = ''
        updateResults()
      }
    }
  })

  function resultsList() {
    const results = search(model, ui.query)
    searchInput.setAttribute('aria-expanded', ui.query ? 'true' : 'false')
    if (ui.query && results.length) searchInput.setAttribute('aria-activedescendant', `result-${ui.active}`)
    else searchInput.removeAttribute('aria-activedescendant')
    if (!ui.query) return h('span', { id: 'search-results', hidden: true })
    return h('ul', { class: 'results', id: 'search-results', role: 'listbox', 'aria-label': 'Matching settings' },
      results.length
        ? results.map((r, i) => h('li', { id: `result-${i}`, role: 'option', 'aria-selected': i === ui.active ? 'true' : 'false', onClick: () => jump(r.control) },
            h('span', { class: 'r-label', text: r.control.label }),
            h('span', { class: 'r-path', text: model.path(r.control) + (r.score === 2 ? ` · matches “${r.synonym}”` : '') })))
        : h('li', { class: 'empty', role: 'option', 'aria-disabled': 'true', text: `No settings match “${ui.query}”. Try another word, such as microphone, recording or storage.` }))
  }

  function updateResults() {
    root.querySelector('#search-results').replaceWith(resultsList())
  }

  function header() {
    searchInput.value = ui.query
    const capturePill = model.state.capture
      ? h('div', { class: 'capture-pill', role: 'status' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), model.state.capture.what,
          h('button', { type: 'button', text: 'Stop all capture' }))
      : null
    return h('header', { class: 'header' },
      h('span', { class: 'mark', 'aria-hidden': 'true', text: 'M' }),
      h('h1', { text: 'Settings' }),
      h('span', { class: 'spacer' }),
      capturePill,
      h('div', { class: 'search' }, icon('search', null, 'glass'), searchInput, h('kbd', { text: '⌘F' }), resultsList()),
      h('button', { type: 'button', class: 'icon-button', 'aria-label': 'Close settings' }, icon('close')))
  }

  function sidebar() {
    const item = (dest) =>
      h('button', { type: 'button', class: 'nav-item', 'aria-current': ui.destination === dest.id ? 'page' : undefined,
        onClick: () => { ui.destination = dest.id; ui.view = 'detail'; ui.highlight = null; render() } },
        icon(dest.id), dest.label)
    const main = model.inventory.destinations.filter((d) => !d.drawer)
    const drawer = model.inventory.destinations.find((d) => d.drawer)
    const locked = Object.keys(model.state.locks).length
    return h('nav', { class: 'sidebar', 'aria-label': 'Settings sections' },
      main.map((d) => item(d)),
      h('div', { class: 'nav-sep', role: 'separator' }),
      h('button', { type: 'button', class: 'nav-item', 'aria-expanded': ui.advancedOpen ? 'true' : 'false', 'aria-controls': 'advanced-links',
        'aria-current': ui.destination === drawer.id ? 'page' : undefined,
        onClick: () => { ui.advancedOpen = !ui.advancedOpen; if (ui.advancedOpen) { ui.destination = drawer.id; ui.view = 'detail' } render() } },
        icon('advanced'), drawer.label, h('span', { class: 'nav-chevron' }, icon('chevron'))),
      ui.advancedOpen
        ? h('div', { class: 'nav-sub', id: 'advanced-links' }, drawer.groups.filter((g) =>
            model.inventory.controls.some((c) => c.destination === drawer.id && c.group === g.id && model.visible(c))).map((g) =>
            h('button', { type: 'button', class: 'nav-item', onClick: () => { ui.destination = drawer.id; ui.view = 'detail'; render(); root.querySelector(`#group-${drawer.id}-${g.id}`)?.scrollIntoView({ block: 'start' }) } }, g.label)))
        : null,
      h('div', { class: 'sidebar-foot' },
        locked && model.state.organization
          ? h('div', { class: 'managed-chip' }, icon('lock', null, 'chip-icon'),
              h('span', {}, `${model.state.organization.name} manages ${locked} setting${locked === 1 ? '' : 's'}. `,
                h('button', { type: 'button', onClick: () => { model.state.sheet = 'policy'; render() }, text: 'View policy' })))
          : null,
        h('span', { class: 'proto-tag', text: 'Design prototype · example data' })))
  }

  function statusLine(control) {
    const status = ui.statuses.get(control.id)
    if (!status) return null
    if (status.kind === 'error') {
      return h('div', { class: 'status error', role: 'alert' }, h('span', { text: status.text }),
        status.retry && h('button', { type: 'button', class: 'link', text: 'Try again', onClick: () => commit(control, status.retry) }))
    }
    return h('div', { class: 'status saved', role: 'status', text: status.text })
  }

  /** A lock names its owner and reason, and the value it will set when that differs from the value in force. */
  function lockLine(lock) {
    const owner = lock.pending ? `Locked by ${lock.owner}: ${lock.pending}.` : `Locked by ${lock.owner}.`
    return h('div', { class: 'lock' }, icon('lock'), h('span', { text: `${owner} ${lock.reason}` }))
  }

  function optionLabel(control) {
    const option = model.currentOption(control)
    if (option) return option.label
    const value = model.value(control.keys[0])
    return typeof value === 'boolean' ? (value ? 'On' : 'Off') : String(value ?? '')
  }

  function renderControl(control, lock) {
    const values = model.state.values
    const key = control.keys[0]
    if (lock) return h('span', { class: 'value-chip', text: optionLabel(control) })
    switch (control.type) {
      case 'toggle':
        return h('button', { type: 'button', role: 'switch', class: 'toggle', 'aria-checked': values[key] ? 'true' : 'false',
          'aria-label': control.label, 'data-contrast': 'ui', onClick: () => request(control, { [key]: !values[key] }) })
      case 'segmented':
      case 'route':
        return h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': control.label, 'data-contrast': 'ui' },
          control.options.filter((o) => !o.platforms || o.platforms.includes(model.state.platform))
            .filter((o) => model.shownOption(control, o))
            .map((o) => h('button', { type: 'button', role: 'radio', 'aria-checked': model.currentOption(control) === o ? 'true' : 'false',
              text: o.label, onClick: () => choose(control, o) })))
      case 'select': {
        // '*' stands for a list that lives in code (languages, providers, custom modes); the prototype shows
        // only the concrete entries.
        const options = (control.options ?? []).filter((o) => o.value !== '*')
        return h('select', { 'aria-label': control.label, 'data-contrast': 'ui',
          onChange: (e) => request(control, { [key]: options[e.target.selectedIndex].value }) },
          options.map((o) => h('option', { selected: o.value === values[key], text: o.label })))
      }
      case 'slider':
        return h('input', { type: 'range', 'aria-label': control.label, ...control.range, value: values[key],
          onChange: (e) => request(control, { [key]: Number(e.target.value) }) })
      case 'action':
        return h('button', { type: 'button', class: control.id === 'privacy.delete-all' ? 'button danger' : 'button', text: control.label })
      case 'device-select':
        return [h('select', { 'aria-label': control.label, 'data-contrast': 'ui' }, h('option', { text: 'System default' })),
          h('button', { type: 'button', class: 'button', text: 'Test' })]
      case 'checklist':
        return h('div', { class: 'checks', role: 'group', 'aria-labelledby': `label-${control.id}` }, control.options.map((o) =>
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: values[o.key] === true, 'data-contrast': 'ui',
            onChange: (e) => request(control, { [o.key]: e.target.checked }) }), o.label)))
      case 'text':
        return h('input', { class: 'text-input', type: 'text', 'aria-label': control.label, value: model.state.summaries[control.id] ?? '', 'data-contrast': 'ui' })
      case 'policy-readout':
        return h('button', { type: 'button', class: 'button', text: 'View policy', onClick: () => { model.state.sheet = 'policy'; render() } })
      case 'readout':
        return null
      default:
        return h('button', { type: 'button', class: 'button', text: BUTTON_LABELS[control.type] ?? 'Edit' })
    }
  }

  function row(control) {
    const lock = model.lock(control)
    const summary = model.state.summaries[control.id]
    const special = SPECIAL[control.type]?.(control)
    const isAction = control.type === 'action' && !lock
    const text = h('div', { class: 'text' },
      isAction ? null : h('div', { class: 'label', id: `label-${control.id}`, text: control.label }),
      control.help ? h('div', { class: 'help', text: control.help }) : null,
      summary && !special && !INLINE_SUMMARY.has(control.type) ? h('div', { class: 'help summary', text: summary }) : null,
      model.unmetReasons(control).map((reason) => h('div', { class: 'help', text: reason })),
      lock ? lockLine(lock) : null,
      statusLine(control))
    const stacked = Boolean(special) && !lock
    return h('div', { class: `row${stacked ? ' stacked' : ''}${ui.highlight === control.id ? ' highlight' : ''}`, 'data-control': control.id },
      text, h('div', { class: 'ctl' }, stacked ? special : renderControl(control, lock)))
  }

  const INLINE_SUMMARY = new Set(['text'])

  const BUTTON_LABELS = {
    folder: 'Change', 'folder-list': 'Add folder', connection: 'Manage', 'connection-list': 'Manage', 'connection-options': 'Change',
    'secret-list': 'Manage', licence: 'Manage', account: 'Manage', calibration: 'Set up'
  }

  const SPECIAL = {
    // Card diagrams follow DESIGN.md's chrome contract: a hairline, a capsule, a full bar.
    picker: (control) => h('div', { class: 'picker', role: 'radiogroup', 'aria-labelledby': `label-${control.id}` },
      control.options.map((o, i) => h('button', { type: 'button', role: 'radio', class: 'card-option', 'data-contrast': 'ui',
        'aria-checked': model.currentOption(control) === o ? 'true' : 'false', onClick: () => request(control, o.maps) },
        h('span', { class: 'diagram', 'aria-hidden': 'true' },
          h('i', { style: [`width:10px;height:3px;top:2px`, `width:34px;height:8px`, `width:70%;height:12px`][i] })),
        h('span', { class: 'c-title', text: o.label })))),
    'pack-list': (control) => {
      const packs = control.id === 'advanced.local-generation' ? model.state.generationPacks : model.state.speechPacks
      return h('div', { class: 'list' }, packs.filter((p) => !p.platforms || p.platforms.includes(model.state.platform)).map(packItem))
    },
    'meeting-list': () => h('div', { class: 'list' }, model.state.today.map((m) =>
      h('div', { class: 'item' },
        h('div', { class: 'i-text' }, h('div', { class: 'i-title', text: `${m.time}  ${m.title}` }), h('div', { class: 'i-meta', text: m.status })),
        m.eligible ? h('div', { class: 'i-actions' }, h('button', { type: 'button', class: 'button', text: m.skipped ? 'Undo skip' : 'Skip' })) : null))),
    'skill-list': () => h('div', { class: 'list' }, model.state.skills.map((s) =>
      h('div', { class: 'item' },
        h('div', { class: 'i-text' }, h('div', { class: 'i-title', text: s.title }), h('div', { class: 'i-meta', text: s.meta })),
        h('div', { class: 'i-actions' }, h('button', { type: 'button', class: 'button', 'aria-pressed': s.favorite ? 'true' : 'false', text: s.favorite ? 'Favorite' : 'Add to favorites' }))))),
    'notice-list': () => model.state.speechIssues.length
      ? h('div', { class: 'list' }, model.state.speechIssues.map((n) =>
          h('div', { class: 'item' },
            h('div', { class: 'i-text' }, h('div', { class: 'i-title', text: n.title }), h('div', { class: 'i-meta', text: `${n.detail} ${n.when}.` })),
            h('div', { class: 'i-actions' }, h('button', { type: 'button', class: 'button', text: n.action }), h('button', { type: 'button', class: 'button', text: 'Dismiss' })))))
      : null,
    permission: (control) => h('span', { class: `pill ${model.state.permissions[control.id] === 'Allowed' ? 'good' : 'bad'}`, text: model.state.permissions[control.id] })
  }

  function packItem(pack) {
    const actions = {
      compatible: [h('button', { type: 'button', class: 'button primary', text: pack.cta })],
      downloading: [h('button', { type: 'button', class: 'button', text: 'Pause' }), h('button', { type: 'button', class: 'button', text: 'Cancel' })],
      installed: [h('button', { type: 'button', class: 'button primary', text: 'Use for speech' }), h('button', { type: 'button', class: 'button', text: 'Remove' })],
      'in-use': [],
      unsupported: []
    }[pack.state]
    const label = { compatible: pack.recommended ? 'Recommended' : 'Compatible', downloading: 'Downloading', installed: 'Installed, not in use', 'in-use': 'In use', unsupported: 'Not supported on this Mac' }[pack.state]
    return h('div', { class: 'item' },
      h('div', { class: 'i-text' },
        h('div', { class: 'i-title' }, `${pack.title} `, h('span', { class: `pill${pack.state === 'unsupported' ? ' bad' : ''}`, text: label })),
        h('div', { class: 'i-meta', text: `${pack.languages} · ${pack.size}` }),
        h('div', { class: 'i-meta', text: pack.note }),
        pack.state === 'downloading'
          ? h('div', { class: 'progress', role: 'progressbar', 'aria-label': `${pack.title} download`, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(pack.progress * 100) },
              h('span', { style: `width:${Math.round(pack.progress * 100)}%` }))
          : null),
      actions.length ? h('div', { class: 'i-actions' }, actions) : null)
  }

  function groupSection(dest, group) {
    const all = model.inventory.controls.filter((c) => c.destination === dest.id && c.group === group.id && model.visible(c)
      && !(c.type === 'notice-list' && !model.state.speechIssues.length))
    const everyday = all.filter((c) => !c.disclosure)
    const more = all.filter((c) => c.disclosure)
    const moreKey = `more:${dest.id}.${group.id}`
    const moreOpen = ui.open.has(moreKey)
    const disclosureRow = (key, label, summary, open) =>
      h('button', { type: 'button', class: 'disclosure', 'aria-expanded': open ? 'true' : 'false',
        onClick: () => { ui.open.has(key) ? ui.open.delete(key) : ui.open.add(key); render() } },
        h('span', { class: 'd-label', text: label }), summary ? h('span', { class: 'd-summary', text: summary }) : null, icon('chevron'))
    if (group.disclosure) {
      const key = `${dest.id}.${group.id}`
      const open = ui.open.has(key)
      const summary = GROUP_SUMMARIES[key]?.(model)
      return h('section', { class: 'group', id: `group-${dest.id}-${group.id}`, 'aria-label': group.label },
        h('div', { class: 'rows' }, disclosureRow(key, group.label, summary, open),
          open ? h('div', { class: 'disclosure-body' }, all.map(row)) : null))
    }
    if (!all.length) return null
    return h('section', { class: 'group', id: `group-${dest.id}-${group.id}` },
      h('h3', { text: group.label }),
      h('div', { class: 'rows' }, everyday.map(row),
        more.length ? disclosureRow(moreKey, 'More options', null, moreOpen) : null,
        more.length && moreOpen ? h('div', { class: 'disclosure-body' }, more.map(row)) : null))
  }

  const GROUP_SUMMARIES = {
    'voice.local-speech': (m) => {
      const packs = m.state.speechPacks
      const inUse = packs.find((p) => p.state === 'in-use')
      if (inUse) return `In use: ${inUse.title}`
      if (packs.some((p) => p.state === 'downloading')) return 'Downloading'
      if (packs.some((p) => p.state === 'installed')) return 'Installed, not in use'
      return 'Not installed · Review compatibility'
    },
    'voice.vocabulary': (m) => m.state.summaries['voice.corrections'],
    'voice.desk-tap': (m) => m.state.summaries['voice.desk-tap'],
    'knowledge.sources': (m) => m.state.summaries['knowledge.dust-options'],
    'knowledge.indexing': () => 'Batched twice a day',
    'knowledge.time-saved': (m) => m.state.summaries['knowledge.time-saved']
  }

  function banner(b) {
    return h('div', { class: `banner ${b.tone}`, role: b.tone === 'warning' ? 'alert' : 'status' },
      h('div', {}, h('p', { class: 'b-title', text: b.title }), h('p', { text: b.text }),
        h('div', { class: 'b-actions' }, b.actions.map((a) => h('button', { type: 'button', class: a.primary ? 'button primary' : 'button', text: a.label,
          onClick: a.label === 'View policy' ? () => { model.state.sheet = 'policy'; render() } : undefined })))))
  }

  function readiness(dest) {
    const r = model.state.readiness[dest.id]
    const statusWord = { good: 'Ready', bad: 'Needs attention', warn: 'Check' }[r.status]
    return h('div', { class: 'readiness', role: 'status' },
      h('span', { class: `status-dot${r.status === 'bad' ? ' bad' : r.status === 'warn' ? ' warn' : ''}`, 'aria-hidden': 'true' }),
      h('div', { class: 'r-text' }, h('div', { class: 'r-title' }, h('span', { class: 'visually-hidden', text: `${statusWord}: ` }), r.title),
        h('div', { class: 'r-detail', text: r.detail })),
      r.actions ? h('div', { class: 'b-actions' }, r.actions.map((a) => h('button', { type: 'button', class: a.primary ? 'button primary' : 'button', text: a.label }))) : null)
  }

  function content() {
    const dest = model.destinations.get(ui.destination)
    return h('main', { class: 'content', id: 'settings-content', 'aria-labelledby': 'dest-title' },
      h('button', { type: 'button', class: 'back', onClick: () => { ui.view = 'list'; render() } }, icon('back'), 'Settings'),
      h('h2', { class: 'dest', id: 'dest-title', text: dest.label }),
      h('p', { class: 'dest-summary', text: dest.summary }),
      model.state.banners.map(banner),
      readiness(dest),
      dest.groups.map((g) => groupSection(dest, g)))
  }

  function policySheet() {
    const org = model.state.organization
    return h('div', { class: 'scrim' },
      h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'policy-title' },
        h('h2', { id: 'policy-title', text: 'Effective policy' }),
        h('p', { class: 'summary', text: `${org.name} · policy revision ${org.revision}. Locked settings cannot be changed on this device; organization defaults can.` }),
        h('table', {},
          h('thead', {}, h('tr', {}, ['Setting', 'Value', 'Set by', 'Why'].map((t) => h('th', { scope: 'col', text: t })))),
          h('tbody', {}, model.state.policy.map((p) => h('tr', {}, h('td', { text: p.setting }), h('td', { text: p.value }), h('td', { text: p.source }), h('td', { text: p.why }))))),
        h('div', { class: 's-actions' }, h('button', { type: 'button', class: 'button primary', text: 'Done', onClick: () => { model.state.sheet = null; render() } }))))
  }

  function confirmSheet() {
    const { control, changes } = ui.confirm
    return h('div', { class: 'scrim' },
      h('div', { class: 'sheet', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title' },
        h('h2', { id: 'confirm-title', text: `Change “${control.label}”?` }),
        h('p', { text: control.help }),
        h('div', { class: 's-actions' },
          h('button', { type: 'button', class: 'button', text: 'Cancel', onClick: () => { ui.confirm = null; render() } }),
          h('button', { type: 'button', class: 'button primary', text: 'Change', onClick: () => { ui.confirm = null; commit(control, changes) } }))))
  }

  function render() {
    root.replaceChildren(...[header(), h('div', { class: 'body' }, sidebar(), content()),
      model.state.sheet === 'policy' ? policySheet() : null, ui.confirm ? confirmSheet() : null].filter(Boolean))
    root.dataset.view = ui.view
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      root.querySelector('#settings-search')?.focus()
    }
  })

  return render
}

async function boot() {
  const root = document.getElementById('app')
  let inventory
  try {
    inventory = await (await fetch(INVENTORY_URL)).json()
  } catch {
    root.replaceChildren(h('p', { class: 'boot-note', text: 'Open this prototype through a static web server rooted at the settings design folder, for example: python3 -m http.server, then /prototype/.' }))
    return
  }
  const fixture = window.SETTINGS_STATES.find((s) => s.id === params.get('state')) ?? window.SETTINGS_STATES[0]
  document.title = `Métis Settings · ${fixture.title}`
  const render = createApp(root, inventory, fixture)
  render()
  if (fixture.scrollTo) root.querySelector(`[data-control="${fixture.scrollTo}"]`)?.scrollIntoView({ block: 'center' })
  if (fixture.query) root.querySelector('#settings-search').focus()
  root.dataset.ready = 'true'
}

boot()
