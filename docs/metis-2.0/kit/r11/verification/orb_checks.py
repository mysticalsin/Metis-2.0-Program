#!/usr/bin/env python3
"""r8 synthetic visual tests; no audio, native action, network or dependency installation."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,json,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--report',type=Path);ap.add_argument('--root',type=Path,default=ROOT);ap.add_argument('--browser',default='/usr/bin/chromium');a=ap.parse_args()
 from playwright.sync_api import sync_playwright
 checks=[];errors=[];requests=[]
 def check(name,fn):
  try:
   result=fn();assert result is not False
   checks.append({'check':name,'passed':True,'detail':result or 'Passed'})
  except Exception as e:checks.append({'check':name,'passed':False,'detail':str(e)[:1500]})
  print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+name,file=sys.stderr,flush=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=a.browser,headless=True);ctx=b.new_context(viewport={'width':1460,'height':1040});ctx.set_default_timeout(2500)
  ctx.on('request',lambda q:requests.append(q.url));page=ctx.new_page()
  def load(f='visual/index.html',fallback=False):
   nonlocal page
   page.close();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install()
   h=(a.root/f).read_text()
   if fallback:h=h.replace('<script>','<script>HTMLCanvasElement.prototype.getContext=()=>null;</script><script>',1)
   page.set_content(h,wait_until='load');page.wait_for_timeout(100)
  def state(x):page.evaluate('(x)=>MetisDemo.setState(x)',x)
  def snap():return page.evaluate('MetisDemo.snapshot()')
  def hit():return page.locator('#armed-orb')
  load()
  check('Initial ARMED is the actual default preview',lambda:snap()['state']=='armed')
  def only():
   state('armed');assert hit().is_visible();assert page.locator('#command-stack').inner_text().strip()==''
   for sel in ['#wake-handle','#caption','#result-card','#command-input','#action-stop','#action-submit']:assert not page.locator(sel).is_visible(),sel
   assert page.locator('#mesh').count()==1 and page.locator('#armed-orb #mesh').count()==1
   return 'Exactly one visible orb, no text, bar, caption, input, results or controls.'
  check('ARMED contains only the mesh',only)
  def bounds():
   o=hit().bounding_box();m=page.locator('#mesh').bounding_box();s=page.locator('#command-stack').bounding_box()
   assert o['width']==72 and o['height']==72 and m['width']==64 and m['height']==64,(o,m)
   assert s['width']==72
   styles=hit().evaluate('(e)=>({bg:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow,border:getComputedStyle(e).borderTopWidth})')
   assert styles=={'bg':'rgba(0, 0, 0, 0)','shadow':'none','border':'0px'},styles
   assert page.evaluate('(p)=>document.elementFromPoint(p.x,p.y)?.closest("#armed-orb,#wake-handle")?.id||null',{'x':o['x']-8,'y':o['y']+30}) is None
   return {'orb_target':o,'mesh':m,'native_hit_testing':'NOT_TESTED'}
  check('Tight transparent target and no surrounding DOM blocker',bounds)
  def passive():
   state('armed');hit().hover();hit().focus();g=snap()['generation'];page.clock.fast_forward(500)
   assert snap()['state']=='armed' and snap()['generation']==g
   assert hit().get_attribute('aria-label') and hit().evaluate('(e)=>getComputedStyle(e).outlineStyle')!='none'
  check('Hover/focus leave the orb alone with accessible focus',passive)
  def key(k):
   state('armed');g=snap()['generation'];hit().focus();page.keyboard.press(k)
   assert snap()['state']=='typing' and snap()['generation']==g+1
   assert page.locator('#command-input').evaluate('(e)=>e===document.activeElement')
   assert snap()['acceptedWakes']==0
  check('Enter opens typing once, not microphone capture',lambda:key('Enter'))
  check('Space opens typing once, not microphone capture',lambda:key('Space'))
  def draft():
   page.locator('#command-input').fill('Keep 日本語 😀');page.locator('#command-input').press('Escape')
   assert snap()['state']=='armed' and snap()['draft']=='Keep 日本語 😀'
   assert hit().evaluate('(e)=>e===document.activeElement')
   assert page.locator('#command-stack').inner_text().strip()==''
   hit().click();assert snap()['draft']=='Keep 日本語 😀'
  check('Escape preserves draft with no badge and restores focus',draft)
  def ime():
   page.locator('#command-input').dispatch_event('compositionstart')
   page.locator('#command-input').dispatch_event('keydown',{'key':'Escape','isComposing':True,'bubbles':True})
   assert snap()['state']=='typing'
   page.locator('#command-input').dispatch_event('compositionend')
  check('IME Escape does not dismiss the command',ime)
  def protect_approval():
   state('approval');g=snap()['generation'];a0=snap()['approvalCount']
   page.locator('#command-input').dispatch_event('keydown',{'key':'Enter','bubbles':True})
   assert snap()['state']=='approval' and snap()['generation']==g
   assert page.locator('#command-input').get_attribute('readonly') is not None
   page.locator('#approve').click();page.locator('#approve').dispatch_event('click')
   assert snap()['state']=='executing' and snap()['approvalCount']==a0+1
  check('Enter and a repeated approval cannot bypass the pending state',protect_approval)
  def wake_duplicates():
   state('typing');page.locator('#command-input').fill('');state('armed');g=snap()['generation'];n=snap()['acceptedWakes']
   assert page.evaluate('(g)=>MetisDemo.wake("r6-wake",g)',g)
   assert not page.evaluate('(g)=>MetisDemo.wake("r6-wake",g)',g)
   assert not page.evaluate('(g)=>MetisDemo.wake("r6-second",g)',g)
   assert snap()['acceptedWakes']==n+1 and snap()['state']=='listening'
  check('Duplicate wake events cannot replace an active command',wake_duplicates)
  def wake_draft():
   state('typing');page.locator('#command-input').fill('Pending draft');state('armed');g=snap()['generation']
   assert page.evaluate('(g)=>MetisDemo.wake("r6-draft",g)',g)
   assert snap()['parkedDraft']=='Pending draft' and snap()['draft']=='' and snap()['state']=='listening'
   assert 'Pending draft' not in page.locator('#caption').inner_text()
   assert page.locator('#command-input').get_attribute('readonly') is not None
   page.locator('#action-stop').click();page.locator('#dismiss-surface').click();hit().click()
   assert snap()['draft']=='Pending draft' and snap()['parkedDraft'] is None
  check('Wake remains usable with a parked draft, which returns unchanged',wake_draft)
  def no_focus_transfer():
   state('typing');page.locator('#command-input').fill('');state('armed');hit().focus()
   page.evaluate("""()=>{window.focusCalls=0;const original=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...args){window.focusCalls++;return original.apply(this,args);};}""")
   assert page.evaluate('MetisDemo.wake("r6-keyboard-focus")')
   assert page.evaluate('window.focusCalls')==0
   assert not page.locator('#command-input').evaluate('(e)=>e===document.activeElement')
  check('Wake never programmatically steals focus even from a keyboard-focused orb',no_focus_transfer)
  def off():
   state('off');assert not snap()['wakeEnabled'];page.locator('#command-input').fill('Typed only');page.locator('#action-submit').click()
   assert snap()['state']=='solving' and not snap()['wakeEnabled'];page.locator('#action-stop').click();page.locator('#dismiss-surface').click()
   assert snap()['state']=='off' and snap()['dismissed'] and not hit().is_visible()
  check('OFF typed submission/dismissal do not rearm wake',off)
  def locked():
   page.locator('#scenario').select_option('open');page.locator('#play-sequence').click();g=snap()['generation'];page.clock.fast_forward(450)
   page.locator('#simulate-lock').click();page.clock.fast_forward(10000)
   assert snap()['locked'] and snap()['state']=='off' and snap()['timers']==0 and snap()['dismissed']
   assert not page.evaluate('(g)=>MetisDemo.wake("r6-stale",g)',g)
   assert not page.locator('#command-stack').is_visible()
  check('Simulated lock clears timeline and rejects late wake',locked)
  def animated():
   state('armed');page.wait_for_timeout(120);a0=snap();first=page.locator('#mesh').evaluate('(e)=>e.toDataURL()');page.wait_for_timeout(900);a1=snap();second=page.locator('#mesh').evaluate('(e)=>e.toDataURL()')
   assert a1['animationActive'] and a1['frames']>a0['frames'] and first!=second,(a0,a1)
   return {'frames_drawn':a1['frames']-a0['frames'],'changed_pixels':True,'scope':'synthetic Chromium, not native energy evidence'}
  check('ARMED shows the animated upstream solving geometry',animated)
  def armed_reduced():
   state('armed');page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(120);a0=snap();page.wait_for_timeout(300);a1=snap()
   assert not a1['animationActive'] and a0['frames']==a1['frames']
   page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(150);assert snap()['animationActive']
  check('ARMED honors operating-system reduced motion and resumes',armed_reduced)
  def geometry_source():
   x=page.evaluate('({origin:MetisSolver.origin,mode:MetisSolver.mode,preset:MetisSolver.presetSize,dots:MetisSolver.frame("solving",1).dots.length})')
   assert x['mode']=='solving/rubik' and x['preset']==64 and x['dots']==138,x
   return x
  check('Official solving preset and source provenance exposed',geometry_source)
  def scoped():
   state('typing');page.locator('[data-tab="settings"]').click();g=snap()['generation'];page.keyboard.press('Escape')
   assert snap()['generation']==g and snap()['currentView']=='settings';page.locator('[data-tab="experience"]').click()
  check('Escape in Settings is not hijacked',scoped)
  def wake_focus():
   state('typing');page.locator('#command-input').fill('');state('armed');page.locator('#scenario').focus()
   page.evaluate('(g)=>MetisDemo.wake("r6-focus",g)',snap()['generation'])
   assert page.locator('#scenario').evaluate('(e)=>e===document.activeElement')
  check('Trusted simulated wake does not steal typing focus',wake_focus)
  def narrow():
   page.set_viewport_size({'width':390,'height':844});state('armed');page.locator('[data-place="right"]').click()
   o=hit().bounding_box();d=page.locator('#desktop').bounding_box();assert o['x']>=d['x'] and o['x']+o['width']<=d['x']+d['width'],(o,d)
   page.set_viewport_size({'width':320,'height':760});state('typing');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.set_viewport_size({'width':1460,'height':1040})
  check('390px edge orb and 320px typed view remain contained',narrow)
  def contrast():
   state('armed');page.locator('#theme').select_option('light');page.emulate_media(forced_colors='active');page.keyboard.press('Tab');hit().focus()
   assert hit().is_visible() and not page.locator('#wake-handle').is_visible()
   assert hit().evaluate('(e)=>getComputedStyle(e).outlineWidth')=='2px'
   page.emulate_media(forced_colors='none');page.locator('#theme').select_option('dark')
  check('Light/high-contrast mode retains orb and focus',contrast)
  def unknown():
   state('error');assert 'could not verify' in page.locator('#result-title').inner_text();assert snap()['timers']==0
   page.clock.fast_forward(60000);assert snap()['state']=='error'
  check('Unknown outcome is not auto-dismissed or declared complete',unknown)
  def no_return():
   state('approval');assert not page.evaluate('MetisDemo.dismiss()');assert snap()['state']=='approval'
  check('Collapse cannot bypass unresolved approval',no_return)
  def graphics():
   load(fallback=True);assert page.locator('#mesh-fallback').is_visible() and not page.locator('#mesh').is_visible()
   hit().click();assert snap()['state']=='typing'
  check('Canvas failure retains a static mesh and working typing',graphics)
  load('OPEN-METIS-2.html');check('Root entry has the same orb-only initial state',lambda:snap()['state']=='armed' and not page.locator('#wake-handle').is_visible())
  check('No unexpected external requests',lambda:not [x for x in requests if x.startswith(('http:','https:','ws:','wss:'))])
  check('No runtime JavaScript errors',lambda:not errors)
  report={'scope':'R8_SYNTHETIC_UI_ONLY_NOT_PRODUCT','engine':b.version,'host':'Linux','render_mode':'exact HTML in-memory; Playwright controlled timer/animation clock','executed_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'passed':all(x['passed'] for x in checks),'requests':requests,'errors':errors,'not_tested':['native OS hit testing or lock/capture','microphone/wake model','actual providers','complete React build/typecheck','Windows or Mac installers/signing']}
  b.close()
 text=json.dumps(report,indent=2,ensure_ascii=False)+'\n'
 if a.report:a.report.write_text(text)
 print(text);return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
