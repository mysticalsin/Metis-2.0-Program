#!/usr/bin/env python3
"""Exercise exact synthetic HTML, not actual Métis, native permissions or media."""
from pathlib import Path
import argparse,json
from datetime import datetime,timezone
R=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--report',type=Path);a=ap.parse_args();checks=[];errors=[];requests=[]
 from playwright.sync_api import sync_playwright
 def ck(n,f):
  try:v=f();assert v is not False;checks.append({'check':n,'passed':True})
  except Exception as e:checks.append({'check':n,'passed':False,'detail':str(e)[:600]})
  print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+n,flush=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True);page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(1700);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda q:requests.append(q.url));page.set_content((R/'preview/index.html').read_text())
  def s():return page.evaluate('MetisOnboardingReview.snapshot()')
  ck('Tony Walteur is named in the Métis welcome',lambda:'A welcome from Tony Walteur' in page.inner_text('body'))
  ck('Unprovided recording renders no media element or request',lambda:page.locator('video,audio,source,track').count()==0 and not requests)
  ck('No borrowed presenter or marketing names in the preview',lambda:not any(x.lower() in page.inner_text('body').lower() for x in ['HeyClicky','Vibe Island','Farza','Devon','Jakub']))
  def full_route():
   visited=[s()['scene']]
   for expected in ['problem','reveal','appearance','setup','personalize','ready']:
    page.locator('#next').click();assert s()['scene']==expected;assert page.locator('#scene-heading').evaluate('(e)=>e===document.activeElement');visited.append(expected)
   assert page.locator('#next').is_disabled();return True
  ck('Source-aligned desktop sequence and transition focus retained',full_route)
  ck('Ready without consent cannot complete',lambda:not s()['finished'] and page.locator('#next').is_disabled())
  page.locator('#back').click();page.locator('#consent').check();page.locator('#next').click();page.locator('#next').click()
  ck('Ready plus consent finishes only the fixture, without recording',lambda:s()['finished'] and s()['nativeCalls']==0 and s()['mediaCalls']==0)
  page.locator('#reset').click();ck('Replay retains placement and does not run an old video',lambda:s()['scene']=='hero' and not s()['finished'] and not requests)
  page.evaluate("MetisOnboardingReview.go('appearance')");page.locator('[data-layout="island"]').click();page.locator('#next').click();page.locator('#back').click();ck('Placement selection survives next/back',lambda:page.locator('[data-layout="island"]').get_attribute('aria-pressed')=='true')
  page.locator('#next').click();page.locator('#open-settings').click();ck('Settings handoff waits instead of granting access',lambda:s()['rows']['accessibility']=='waiting')
  generation=s()['generation'];page.locator('#open-settings').click();ck('Repeated handoff does not stack requests',lambda:s()['generation']==generation)
  page.locator('#recheck').click();ck('Unknown readback is not ready',lambda:s()['rows']['accessibility']=='unknown')
  page.locator('.inspector summary').click();page.locator('#fixture').select_option('denied');page.locator('#recheck').click();ck('Denied readback remains denied with visible text',lambda:'Denied' in page.inner_text('#status-accessibility'))
  page.locator('#defer').click();ck('Deferring access leaves that feature off without skipping tour',lambda:s()['rows']['accessibility']=='deferred' and s()['scene']=='setup')
  page.locator('#fixture').select_option('granted_unverified');page.locator('#recheck').click();ck('Unverified grant stays distinct from ready',lambda:'verification pending' in page.inner_text('#status-accessibility'))
  page.locator('#fixture').select_option('granted');page.locator('#recheck').click();ck('Synthetic verified readback is labelled example',lambda:'Granted and rechecked · example' in page.inner_text('#status-accessibility'))
  page.locator('#fixture').select_option('revoked');page.locator('#recheck').click();ck('Revocation replaces previous ready label',lambda:'revoked' in page.inner_text('#status-accessibility'))
  page.locator('#platform').select_option('windows');ck('Windows does not pretend to offer the macOS grant',lambda:'windows capability' in page.inner_text('#details-panel').lower() and 'no macOS Accessibility switch' in page.inner_text('#details-panel'))
  page.locator('#open-settings').click();ck('Windows review does not grant OS privileges',lambda:s()['nativeCalls']==0 and s()['rows']['accessibility']=='revoked')
  page.locator('[data-help="mic"]').click();ck('Guidance can be opened deliberately and focuses its action',lambda:page.locator('#open-settings').evaluate('(e)=>e===document.activeElement') and 'Microphone' in page.inner_text('#details-panel'))
  page.evaluate("MetisOnboardingReview.go('reveal')");page.locator('#demo-text').fill('Québec / R&D <img src=x>');page.locator('#practice-send').click();ck('Typed practice preserves original text without HTML injection',lambda:page.inner_text('#caption')=='Québec / R&D <img src=x>' and page.locator('#caption img').count()==0)
  for mode in ['read','teach','draft']:
   page.locator(f'[data-demo="{mode}"]').click();ck(mode+' explanation causes no capture or external action',lambda:s()['productCalls']==0 and s()['nativeCalls']==0)
  def motion():
   page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);n=s()['frames'];page.wait_for_timeout(200);assert s()['frames']==n
  ck('Reduced motion halts decorative frame work',motion)
  def pause():
   page.emulate_media(reduced_motion='no-preference');page.locator('#motion').click();n=s()['frames'];page.wait_for_timeout(160);assert s()['frames']==n
  ck('Manual pause halts decorative frame work',pause)
  def narrow():
   page.set_viewport_size({'width':390,'height':844})
   for scene in ['hero','problem','reveal','appearance','setup','personalize','ready']:
    page.evaluate('(x)=>MetisOnboardingReview.go(x)',scene);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),scene
  ck('All preserved scenes fit 390px without horizontal overflow',narrow)
  ck('Continue remains in the viewport on narrow Ready',lambda:page.locator('#next').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight && r.top>=0}'))
  def scale():
   page.set_viewport_size({'width':1024,'height':900});page.evaluate("MetisOnboardingReview.go('setup')");page.evaluate("() => {const items=Array.from(document.querySelectorAll('body *')).map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,n] of items)if(Number.isFinite(n))e.style.fontSize=(n*2)+'px';}");assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert page.locator('#next').is_visible()
  ck('Large text retains setup controls without horizontal overflow',scale)
  ck('No network or media requests occurred',lambda:not requests);ck('No JavaScript exceptions occurred',lambda:not errors)
  report={'scope':'SYNTHETIC_HTML_REFERENCE_NOT_PRODUCT','host':'Linux','engine':b.version,'time':datetime.now(timezone.utc).isoformat(),'checks':checks,'requests':requests,'errors':errors,'passed':all(x['passed'] for x in checks)};b.close()
 if a.report:a.report.write_text(json.dumps(report,indent=2))
 return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
