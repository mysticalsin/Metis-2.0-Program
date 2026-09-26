#!/usr/bin/env python3
"""Exercise the exact memory HTML as a synthetic in-memory document, never a product integration."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--report',type=Path,required=True);p.add_argument('--capture',type=Path);a=p.parse_args()
html=(a.root/'memory/visual/index.html').read_text();checks=[];errors=[];requests=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
 page=b.new_page(viewport={'width':1380,'height':1060},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.set_content(html)
 def check(name,fn):
  try: fn();checks.append({'name':name,'passed':True})
  except Exception as e:checks.append({'name':name,'passed':False,'detail':str(e)[:400]})
 def expect_true(v):assert v
 def contains(sel,v):assert v in page.locator(sel).inner_text()
 check('fixture boundary visible',lambda:contains('.fixture','NO BACKEND'))
 check('no foreign Hindsight dashboard',lambda:expect_true(page.locator('iframe').count()==0))
 check('begins not remembered',lambda:contains('#state','Not remembered'))
 page.click('#recall');check('no fabricated prior memory',lambda:contains('#reply','Nothing has been guessed'))
 page.click('#remember');check('explicit remember',lambda:contains('#state','Available'))
 page.click('#newSession');check('new conversation keeps approved memory',lambda:contains('#session','2'))
 page.click('#recall');page.wait_for_timeout(280);check('recall has source revision',lambda:contains('#reply','revision 1'))
 check('memory grants no action authority',lambda:contains('#reply','does not authorize an action'))
 page.click('#inspect');check('source drawer visible',lambda:expect_true(page.locator('#details').is_visible()))
 page.click('#correct');page.fill('#editText','Préférer le français, mais ne pas envoyer sans accord.');page.click('#saveEdit')
 check('Unicode canonical correction preserved',lambda:contains('#memoryText','Préférer le français'))
 check('stale projection not claimed ready',lambda:contains('#state','Needs refresh'))
 page.click('#recall');check('old memory withheld after correction',lambda:contains('#reply','No current approved memory'))
 page.click('#remember');page.click('#recall');page.wait_for_timeout(280);check('refreshed revision used',lambda:contains('#reply','revision 2'))
 page.click('#recall');page.check('#team');page.wait_for_timeout(280)
 check('scope change suppresses late answer',lambda:expect_true('Your approved' not in page.locator('#reply').inner_text()))
 check('different audience hides private source',lambda:expect_true('Préférer' not in page.locator('#memoryText').inner_text()))
 check('private inspection unavailable',lambda:expect_true(page.locator('#inspect').is_disabled()))
 page.click('#recall');check('no accessible memory versus leaked source',lambda:contains('#reply','No accessible memory'))
 page.uncheck('#team');page.check('#ephemeral');page.click('#recall');check('ephemeral never recalls',lambda:contains('#reply','not consulted'))
 check('ephemeral cannot retain',lambda:expect_true(page.locator('#remember').is_disabled()))
 page.uncheck('#ephemeral');page.check('#outage');page.click('#recall');check('outage disclosed not empty',lambda:contains('#reply','unavailable'))
 page.uncheck('#outage');page.click('#recall');page.click('#forget');page.wait_for_timeout(280)
 check('forget prevents late recalled output',lambda:contains('#reply','blocked from future use'))
 check('removal does not fake physical erasure',lambda:contains('#state','Removal pending'))
 check('forgotten content absent from active memory',lambda:expect_true('Préférer' not in page.locator('#memoryText').inner_text()))
 page.click('#finishPurge');check('primary removal still has backup caveat',lambda:contains('#status','backup erasure'))
 page.click('#theme');check('light mode remains usable',lambda:expect_true(page.locator('body').evaluate("e=>e.classList.contains('light')")))
 page.set_viewport_size({'width':390,'height':1100});check('narrow viewport no horizontal overflow',lambda:expect_true(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')))
 check('keyboard-focusable primary controls',lambda:expect_true(page.locator('#recall').evaluate('e=>e.tabIndex>=0')))
 check('no unexpected JS errors',lambda:expect_true(not errors));check('no external requests',lambda:expect_true(not requests))
 if a.capture:
  page.set_viewport_size({'width':1380,'height':1060});page.set_content(html);page.click('#remember');page.click('#newSession');page.click('#recall');page.wait_for_timeout(280);page.click('#inspect');a.capture.parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(a.capture),full_page=True)
 browser_version=b.version;b.close()
a.report.parent.mkdir(parents=True,exist_ok=True);out={'scope':'SYNTHETIC_MEMORY_HTML_NOT_PRODUCT','browser':browser_version,'execution':'in_memory_exact_html','passed':all(c['passed'] for c in checks),'checks':checks,'external_requests':requests,'javascript_errors':errors};a.report.write_text(json.dumps(out,indent=2));print(json.dumps({'passed':sum(c['passed'] for c in checks),'total':len(checks)}));raise SystemExit(0 if out['passed'] else 1)
