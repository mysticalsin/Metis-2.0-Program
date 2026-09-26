#!/usr/bin/env python3
"""Actual browser tests of the supplied synthetic HTML, not of a native app or service."""
from pathlib import Path
import argparse,json,sys
from datetime import datetime,timezone

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--report',type=Path);ap.add_argument('--browser',default='/usr/bin/chromium');args=ap.parse_args()
 from playwright.sync_api import sync_playwright
 checks=[];errors=[];requests=[]
 def ck(name,fn):
  try:result=fn();assert result is not False;checks.append({'check':name,'passed':True,'detail':result or 'Passed'})
  except Exception as e:checks.append({'check':name,'passed':False,'detail':str(e)[:1000]})
  print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+name,file=sys.stderr,flush=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=args.browser,headless=True);page=None
  def load():
   nonlocal page
   if page:page.close()
   page=browser.new_page(viewport={'width':1460,'height':1050});page.set_default_timeout(1800);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda q:requests.append(q.url));page.set_content((args.root/'visual/agents/index.html').read_text(),wait_until='load')
  def snap():return page.evaluate('AgentDemo.snapshot()')
  def home():page.locator('[data-view="home"]').click()
  load();ck('Preview is labelled without provider or microphone pretense',lambda:'SIMULATED · NO MICROPHONE OR BACKEND' in page.inner_text('body') and snap()['productCalls']==0)
  ck('Agent workspace opens without replacing Métis onboarding',lambda:snap()['view']=='home' and page.locator('a[href="../../onboarding/preview/index.html"]').count()==1)
  def pause():
   page.wait_for_timeout(150);n=snap()['frameCount'];page.wait_for_timeout(160);assert snap()['frameCount']>n;page.locator('#pause-motion').click();n=snap()['frameCount'];page.wait_for_timeout(180);assert snap()['frameCount']==n;page.locator('#pause-motion').click()
  ck('Reviewed animated orb runs and manual pause freezes work',pause)
  page.locator('[data-view="onboarding"]').click()
  ck('Agent naming is an optional standalone sheet',lambda:'not a replacement' in page.inner_text('#step-content') and page.locator('#steps').inner_text()=='')
  def duplicates():
   page.locator('[data-name="0"]').fill('Same');page.locator('[data-name="1"]').fill('Same');page.locator('#next-step').click();assert snap()['creations']==0;page.locator('[data-name="0"]').fill('My Brief');page.locator('[data-name="1"]').fill('Scout')
  ck('Conflicting names cannot create ambiguous starter agents',duplicates)
  page.locator('#next-step').click()
  ck('Creating definitions starts no task and returns to workspace',lambda:snap()['view']=='home' and snap()['creations']==3 and snap()['runs']==0 and snap()['productCalls']==0)
  ck('User-chosen names preserved',lambda:page.inner_text('#active-name')=='My Brief')
  def replay():
   page.locator('[data-view="library"]').click();page.locator('#replay').click();page.locator('#next-step').click();assert snap()['creations']==3 and snap()['runs']==0
  ck('Editing names does not duplicate agents or start work',replay)
  home()
  def drafts():
   page.locator('#compose').fill('Québec / R&D\n日本語');page.locator('[data-agent="follow"]').click();assert page.locator('#compose').input_value()=='';page.locator('#compose').fill('Follow up later');page.locator('[data-agent="brief"]').click();assert page.locator('#compose').input_value()=='Québec / R&D\n日本語';page.locator('#compose').fill('')
  ck('Agent switching preserves separate Unicode drafts',drafts)
  def ime():
   page.locator('#compose').fill('日本語');page.locator('#compose').dispatch_event('compositionstart');page.locator('#compose').press('Enter');assert snap()['runs']==0;page.locator('#compose').dispatch_event('compositionend');page.locator('#compose').press('Shift+Enter');assert snap()['runs']==0;page.locator('#compose').fill('')
  ck('IME and Shift+Enter do not submit prematurely',ime)
  def read():
   page.locator('#request-mode').select_option('read');page.locator('#compose').fill('Read this document');page.locator('#send').click();page.wait_for_timeout(700);assert snap()['stage']=='answered' and not page.locator('#run-panel').is_visible();assert 'Read-only preview' in page.inner_text('#messages')
  ck('Read mode creates no execution proposal',read)
  def teach():
   page.locator('#request-mode').select_option('teach');page.locator('#compose').fill('Show me what to do');page.locator('#send').click();page.wait_for_timeout(700);assert 'No input, click' in page.inner_text('#messages') and snap()['committed']==0 and not snap()['proposal']
  ck('Teach mode explains without action',teach)
  def stale():
   page.locator('#request-mode').select_option('draft');page.locator('#compose').fill('Prepare a draft');page.locator('#send').click();page.wait_for_timeout(700);assert snap()['stage']=='approval';page.locator('#revise-source').click();page.locator('#approve').click();assert snap()['committed']==0 and snap()['stage']=='stale'
  ck('Source correction invalidates a pending approval',stale)
  def once():
   page.locator('#compose').fill('New draft');page.locator('#send').click();page.wait_for_timeout(700);page.locator('#approve').click();page.evaluate('AgentDemo.approve()');assert snap()['committed']==1 and 'No pending proposal' in page.inner_text('#toast') and snap()['productCalls']==0
  ck('Explicit fixture save is committed once, never a real write',once)
  def partial():
   page.locator('#visible-only').click();page.locator('#compose').fill('Summarize every page');page.locator('#send').click();page.wait_for_timeout(700);assert snap()['stage']=='needs-context' and 'cannot claim' in page.inner_text('#messages') and not snap()['proposal']
  ck('Visible screen cannot become a full-document claim',partial)
  def remove():
   page.locator('#remove-source').click();page.locator('#compose').fill('Read this');page.locator('#send').click();page.wait_for_timeout(700);assert 'No source is attached' in page.inner_text('#messages') and not snap()['proposal']
  ck('Removed context remains unavailable for the next response',remove)
  def midflight():
   page.locator('#remove-source').click();page.locator('#visible-only').click();page.locator('#compose').fill('Prepare this');page.locator('#send').click();page.locator('#revise-source').click();page.wait_for_timeout(700);assert not snap()['proposal'] and 'Context changed' in page.inner_text('#toast')
  ck('Context changes during work suppress the stale result',midflight)
  def switch_busy():
   page.locator('#compose').fill('Old agent request');page.locator('#send').click();page.locator('[data-agent="follow"]').click();page.wait_for_timeout(700);assert snap()['selected']=='follow' and snap()['stage']=='idle' and 'Old agent request' not in page.inner_text('#messages')
  ck('Late result cannot leak across agent switch',switch_busy)
  def cancel():
   page.locator('#compose').fill('Cancel this');page.locator('#send').click();page.locator('#stop').click();page.wait_for_timeout(700);assert snap()['stage']=='cancelled' and not snap()['proposal']
  ck('Stop suppresses scheduled fixture completion',cancel)
  def inert():
   page.locator('#compose').fill('<img src=x onerror="window.injected=1">');page.locator('#send').click();page.wait_for_timeout(700);assert page.locator('#messages img').count()==0 and page.evaluate('window.injected===undefined')
  ck('HTML-like user input renders as text, not executable markup',inert)
  def typed():
   page.locator('#orb-launch').click();assert page.locator('#compose').evaluate('(e)=>e===document.activeElement') and snap()['productCalls']==0
  ck('The orb deliberately opens typed input without capture',typed)
  def motion():
   page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);n=snap()['frameCount'];page.wait_for_timeout(180);assert snap()['frameCount']==n;page.emulate_media(reduced_motion='no-preference')
  ck('OS reduced motion freezes continuous rendering',motion)
  def narrow():
   page.set_viewport_size({'width':390,'height':844});page.locator('#compose').fill('x'*1200);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.locator('[data-view="onboarding"]').click();page.evaluate('AgentDemo.go(4)');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.locator('[data-view="library"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  ck('390px Home, agent naming and library remain contained',narrow)
  ck('No HTTP, WebSocket or media requests',lambda:not requests)
  ck('No JavaScript exceptions',lambda:not errors)
  report={'scope':'SYNTHETIC_AGENT_ONBOARDING_REFERENCE_NOT_PRODUCT','engine':browser.version,'host':'Linux','render_mode':'in-memory exact HTML','executed_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'requests':requests,'errors':errors,'passed':all(x['passed'] for x in checks)};browser.close()
 data=json.dumps(report,ensure_ascii=False,indent=2)+'\n';print(data)
 if args.report:args.report.write_text(data)
 return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
