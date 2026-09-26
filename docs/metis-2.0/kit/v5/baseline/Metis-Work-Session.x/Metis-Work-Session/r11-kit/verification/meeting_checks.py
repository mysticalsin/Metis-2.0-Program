#!/usr/bin/env python3
"""Synthetic meeting-workspace checks. No real services, capture or model calls."""
from pathlib import Path
from datetime import datetime, timezone
import argparse,json,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=ROOT);ap.add_argument('--report',type=Path);ap.add_argument('--browser',default='/usr/bin/chromium');a=ap.parse_args()
 from playwright.sync_api import sync_playwright
 checks=[];errors=[];requests=[]
 def ck(name,fn):
  try:v=fn();assert v is not False;checks.append({'check':name,'passed':True,'detail':v or 'Passed'})
  except Exception as e:checks.append({'check':name,'passed':False,'detail':str(e)[:1200]})
  print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+name,file=sys.stderr,flush=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=a.browser,headless=True);page=b.new_page(viewport={'width':1460,'height':1040});page.set_default_timeout(2000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda q:requests.append(q.url))
  def load():
   nonlocal page
   page.close();page=b.new_page(viewport={'width':1460,'height':1040});page.set_default_timeout(2000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda q:requests.append(q.url))
   page.set_content((a.root/'visual/meeting/index.html').read_text(),wait_until='load')
  def snap():return page.evaluate('MeetingDemo.snapshot()')
  load();ck('Meeting starts with labelled synthetic scope',lambda:snap()['phase']=='meet' and 'NO MICROPHONE OR BACKEND' in page.inner_text('body'))
  def tabs():
   page.locator('#tab-meet').focus();page.keyboard.press('ArrowLeft');assert snap()['phase']=='prepare' and page.locator('#tab-prepare').evaluate('(e)=>e===document.activeElement');page.keyboard.press('End');assert snap()['phase']=='follow';page.keyboard.press('Home');assert snap()['phase']=='prepare'
  ck('Keyboard phase tabs use selection and focus correctly',tabs)
  page.locator('#enter-meeting').click();ck('Prepare enters actual local meeting panel',lambda:snap()['phase']=='meet')
  original='Keep Québec “hello” \\ path\n日本語 <img src=x onerror="window.bad=1">';page.locator('#human-notes').fill(original)
  def enhance():
   page.locator('#enhance').click();assert snap()['notes']==original and page.locator('#enhancement').is_visible();assert page.locator('#enhancement img').count()==0 and page.evaluate('window.bad===undefined')
  ck('Enhancement is a separate inert proposal, original preserved',enhance)
  def conflict():
   page.locator('#human-notes').fill(original+'\nLater human edit');page.locator('#accept-enhancement').click();assert 'source changed' in page.inner_text('#toast') and snap()['accepted'] is None;assert snap()['notes'].endswith('Later human edit')
  ck('Stale enhancement cannot overwrite a newer human edit',conflict)
  def accept():
   page.locator('#enhance').click();page.locator('#accept-enhancement').click();assert snap()['accepted'] and snap()['notes'].endswith('Later human edit') and not page.locator('#enhancement').is_visible()
  ck('Accepted alternative remains distinct from raw human notes',accept)
  def topic():
   page.locator('#enhance').click();page.locator('#advance-discussion').click();page.locator('#accept-enhancement').click();assert 'source changed' in page.inner_text('#toast');assert 'context changed' in page.inner_text('#assist-answer');page.locator('[data-assist="question"]').click();assert 'rollout ownership' in page.inner_text('#assist-answer')
  ck('Topic revision invalidates outdated suggestion and proposal',topic)
  def markers():
   page.locator('#mark-moment').click();assert snap()['markers']==1;page.locator('#toggle-capture').click();page.locator('#mark-moment').click();assert snap()['markers']==1 and snap()['paused'];page.locator('[data-assist="catchup"]').click();assert 'paused' in page.inner_text('#toast');page.locator('#toggle-capture').click()
  ck('Pause suppresses new markers and live-context requests',markers)
  before=snap()['notes'];page.locator('#next-meeting').click();ck('Next-meeting preview preserves the active human notes',lambda:snap()['phase']=='prepare' and snap()['notes']==before)
  page.locator('#brief-source').click();ck('Brief limits disclose missing live sources',lambda:page.locator('#brief-limits').is_visible() and 'No email' in page.inner_text('#brief-limits'))
  page.locator('#tab-follow').click()
  def crm():
   page.locator('#approve-crm').click();assert snap()['crmApplied'] and snap()['crmRevision']==8;page.locator('#approve-crm').click();assert snap()['crmRevision']==8 and 'already applied' in page.inner_text('#toast');assert 'No real CRM write' in page.inner_text('#crm-status')
  ck('Reviewed synthetic apply is idempotent and never called a real write',crm)
  def share():
   page.locator('#audience').select_option('external');page.locator('#share-preview').click();assert 'Blocked' in page.inner_text('#share-status') and 'No link created' in page.inner_text('#share-status');page.locator('#audience').select_option('self');page.locator('#share-preview').click();assert 'No link created' in page.inner_text('#share-status')
  ck('Private source cannot be shared to entire external meeting',share)
  load();page.locator('#tab-follow').click();page.locator('#crm-conflict').click();page.locator('#approve-crm').click();ck('Changed remote revision rejects a stale CRM proposal',lambda:not snap()['crmApplied'] and 'Conflict' in page.inner_text('#crm-status'))
  def narrow():
   page.set_viewport_size({'width':390,'height':844});page.locator('#tab-meet').click();page.locator('#human-notes').fill('longword'*100);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert page.locator('#enhance').is_visible();page.locator('#enhance').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.locator('#tab-follow').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  ck('390px meeting and follow-up views remain contained',narrow)
  ck('No product API calls are fabricated',lambda:snap()['productCalls']==0)
  ck('No HTTP, WebSocket or media requests',lambda:not requests)
  ck('No JavaScript exceptions',lambda:not errors)
  report={'scope':'SYNTHETIC_MEETING_REFERENCE_NOT_PRODUCT','engine':b.version,'host':'Linux','render_mode':'in-memory exact HTML','executed_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'passed':all(x['passed'] for x in checks),'requests':requests,'errors':errors};b.close()
 out=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
 if a.report:a.report.write_text(out)
 print(out);return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
