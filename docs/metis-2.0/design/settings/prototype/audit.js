'use strict'
/* In-page design audit for the Settings 2.0 prototype (M2-0101): WCAG 2.2 AA text contrast (1.4.3),
   non-text contrast of controls and the focus indicator (1.4.11), clipping and horizontal overflow, and the
   motion budget. The capture harness injects this file into every captured state; nothing else loads it. */

window.auditSettingsPrototype = function auditSettingsPrototype({ reducedMotion, maxTransitionMs }) {
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean)
    return [Number(r), Number(g), Number(b), Number(a)]
  }
  const over = (top, bottom) => {
    const a = top[3]
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1)
  }
  const luminance = ([r, g, b]) => {
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  const describe = (el) => {
    const text = (el.value || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''} “${text.slice(0, 48)}”`
  }
  const rendered = (el) => {
    const style = getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0
  }
  /** Background actually painted behind an element: its own and its ancestors' colors, composited. */
  const backdrop = (el) => {
    const layers = []
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.backgroundImage !== 'none') return { unverifiable: true }
      const color = parse(style.backgroundColor)
      if (color && color[3] > 0) layers.push(color)
      if (color && color[3] === 1) break
    }
    let base = layers.length && layers[layers.length - 1][3] === 1 ? layers.pop() : [255, 255, 255, 1]
    while (layers.length) base = over(layers.pop(), base)
    return { color: base }
  }
  const opacity = (el) => {
    let value = 1
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) value *= Number(getComputedStyle(node).opacity)
    return value
  }
  const isVisuallyHidden = (el) => el.closest('.visually-hidden') !== null

  const text = { checked: 0, failures: [], unverifiable: [] }
  const checkText = (el, colorValue) => {
    const bg = backdrop(el)
    if (bg.unverifiable) { text.unverifiable.push(describe(el)); return }
    const fg = parse(colorValue)
    const alpha = fg[3] * opacity(el)
    const painted = over([fg[0], fg[1], fg[2], alpha], bg.color)
    const style = getComputedStyle(el)
    const size = parseFloat(style.fontSize)
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
    const required = large ? 3 : 4.5
    const r = ratio(painted, bg.color)
    text.checked += 1
    if (r < required) text.failures.push({ element: describe(el), ratio: Number(r.toFixed(2)), required })
  }
  for (const el of document.querySelectorAll('body *')) {
    if (!rendered(el) || isVisuallyHidden(el) || el.closest('[disabled], [aria-disabled="true"]')) continue
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (ownText) checkText(el, getComputedStyle(el).color)
    if (el.matches('input[type="search"], input[type="text"]')) {
      if (el.value) checkText(el, getComputedStyle(el).color)
      else if (el.placeholder) checkText(el, getComputedStyle(el, '::placeholder').color)
    }
    if (el.matches('select')) checkText(el, getComputedStyle(el).color)
  }

  const nonText = { checked: 0, failures: [] }
  for (const el of document.querySelectorAll('[data-contrast="ui"], [role="radio"][aria-checked="true"]')) {
    if (!rendered(el)) continue
    const style = getComputedStyle(el)
    const border = parse(style.borderTopColor)
    const fill = parse(style.backgroundColor)
    const around = backdrop(el.parentElement)
    if (around.unverifiable) continue
    const hasBorder = parseFloat(style.borderTopWidth) > 0 && border && border[3] > 0
    const edge = hasBorder ? over(border, around.color) : over(fill, around.color)
    const r = Math.max(ratio(edge, around.color), fill && fill[3] > 0 ? ratio(over(fill, around.color), around.color) : 0)
    nonText.checked += 1
    if (r < 3) nonText.failures.push({ element: describe(el), ratio: Number(r.toFixed(2)), required: 3 })
  }

  const root = getComputedStyle(document.documentElement)
  const token = (name) => {
    const probe = document.createElement('span')
    probe.style.color = `var(${name})`
    document.body.append(probe)
    const value = parse(getComputedStyle(probe).color)
    probe.remove()
    return value
  }
  const focus = token('--focus')
  const focusIndicator = ['--bg', '--surface', '--card', '--raised', '--accent-soft'].map((name) => {
    const r = ratio(focus, token(name))
    return { against: name, ratio: Number(r.toFixed(2)), pass: r >= 3 }
  })

  const measure = document.createElement('canvas').getContext('2d')
  const textWidth = (value, style) => {
    measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    return measure.measureText(value).width
  }
  const clipping = { checked: 0, failures: [] }
  const width = document.documentElement.clientWidth
  if (document.documentElement.scrollWidth > width + 1) clipping.failures.push({ element: 'document', problem: 'horizontal page scroll' })
  for (const el of document.querySelectorAll('body *')) {
    if (!rendered(el) || isVisuallyHidden(el)) continue
    const style = getComputedStyle(el)
    const hasText = el.textContent.trim().length > 0 || (el.value ?? '').length > 0
    clipping.checked += 1
    const scrollsX = ['auto', 'scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 1
    if (scrollsX) clipping.failures.push({ element: describe(el), problem: 'horizontal scrolling' })
    const hides = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY) || style.textOverflow === 'ellipsis'
    if (hasText && hides && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && !el.title) {
      clipping.failures.push({ element: describe(el), problem: 'text clipped' })
    }
    if (el.matches('select, input[type="text"], input[type="search"]')) {
      const shown = el.matches('select') ? el.selectedOptions[0]?.text ?? '' : el.value || el.placeholder
      const room = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - (el.matches('select') ? 20 : 0)
      if (textWidth(shown, style) > room + 0.5) clipping.failures.push({ element: describe(el), problem: 'control text clipped' })
    }
    const rect = el.getBoundingClientRect()
    const scrollAncestor = el.parentElement?.closest('.content, .sidebar, .results, .sheet')
    if (!scrollAncestor && hasText && (rect.right > width + 0.5 || rect.left < -0.5)) {
      clipping.failures.push({ element: describe(el), problem: 'outside the window' })
    }
  }

  const motion = { maxTransitionMs: 0, running: document.getAnimations().length, failures: [] }
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el)
    for (const part of [style.transitionDuration, style.animationDuration]) {
      for (const d of part.split(',')) {
        const ms = d.trim().endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000
        motion.maxTransitionMs = Math.max(motion.maxTransitionMs, ms || 0)
      }
    }
  }
  if (reducedMotion && motion.maxTransitionMs > 0) motion.failures.push(`reduced motion still animates (${motion.maxTransitionMs} ms)`)
  if (motion.maxTransitionMs > maxTransitionMs) motion.failures.push(`transition longer than ${maxTransitionMs} ms`)
  if (motion.running > 0) motion.failures.push(`${motion.running} animation(s) still running after settle`)

  const pass = !text.failures.length && !text.unverifiable.length && !nonText.failures.length
    && focusIndicator.every((f) => f.pass) && !clipping.failures.length && !motion.failures.length
  return { pass, text, nonText, focusIndicator, clipping, motion, colorScheme: root.colorScheme }
}
