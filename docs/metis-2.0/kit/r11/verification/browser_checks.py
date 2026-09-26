#!/usr/bin/env python3
"""Test only the synthetic delivery-kit UI using in-memory Chromium rendering.

Requires an existing Python Playwright installation and Chromium. No dependency
installation, network service, product deployment or microphone is requested.
File/loopback launch in a user's browser is a separate environment-specific check.
"""
from __future__ import annotations
import argparse, json, sys, platform
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--browser',default='/usr/bin/chromium')
    parser.add_argument('--report',type=Path)
    parser.add_argument('--capture-dir',type=Path)
    args=parser.parse_args(); root=args.root.resolve()
    try: from playwright.sync_api import sync_playwright
    except ImportError:
        print('Playwright is not installed. No browser checks ran.',file=sys.stderr); return 2
    checks=[]; errors=[]; requests=[];shots=[]
    def check(name,fn):
        try:
            value=fn()
            if value is False: raise AssertionError('condition returned false')
            checks.append({'check':name,'passed':True,'detail':value if value is not None else 'Passed'})
        except Exception as e:
            checks.append({'check':name,'passed':False,'detail':str(e)[:1500]})
        print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+name, file=sys.stderr, flush=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=args.browser,headless=True,args=[])
        context=browser.new_context(viewport={'width':1460,'height':1040},device_scale_factor=1)
        context.set_default_timeout(3500)
        context.on('request',lambda r:requests.append(r.url))
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        def load(rel):
            nonlocal page
            page.close()
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.clock.install()
            page.set_content((root/rel).read_text(encoding='utf-8'),wait_until='load',timeout=7000)
            page.clock.fast_forward(160)
        def state(x):page.evaluate('(x)=>MetisDemo.setState(x)',x);page.clock.fast_forward(75)
        def snap():return page.evaluate('MetisDemo.snapshot()')
        def capture(name):
            if not args.capture_dir:return
            args.capture_dir.mkdir(parents=True,exist_ok=True)
            path=args.capture_dir/name
            page.screenshot(path=str(path),full_page=True,animations='disabled')
            shots.append(name)
        load('visual/index.html')
        check('demo boots in Chromium memory document',lambda:snap()['phase']=='ARMED')
        for item in json.loads((root/'visual/STATE-MAP.json').read_text())['states']:
            def one(i=item):
                state(i['visual_id']);s=snap()
                assert s['phase']==i['contract_phase'],s
                assert page.locator(f'button[data-state="{i["visual_id"]}"]').get_attribute('aria-pressed')=='true'
                return {'visual':i['visual_id'],'phase':s['phase']}
            check('state '+item['visual_id'],one)
        state('solving')
        def geometry():
            c=page.locator('#caption').bounding_box();b=page.locator('.pill').bounding_box();o=page.locator('#mesh').bounding_box()
            assert c['y']+c['height'] < b['y']+1,(c,b)
            assert o['x']>=b['x'] and o['x']+o['width']<=b['x']+b['width'],(o,b)
            assert o['y']>=b['y'] and o['y']+o['height']<=b['y']+b['height'],(o,b)
            return 'Caption above; mesh entirely inside bar.'
        check('requested visual hierarchy',geometry)
        check('no decorative state label beside orb',lambda:page.locator('.pill').inner_text().strip()=='Preview command text')
        check('working mode has one Stop and no Send control',lambda:page.locator('#action-stop').is_visible() and not page.locator('#action-submit').is_visible())
        capture('01-solving-desktop.png')
        state('off')
        check('off mode has one Send and no Stop control',lambda:page.locator('#action-submit').is_visible() and not page.locator('#action-stop').is_visible())
        state('armed');page.locator('#armed-orb').focus();page.keyboard.press('Enter')
        check('collapsed handle expands by keyboard with input focus',lambda:snap()['state']=='typing' and page.locator('#command-input').evaluate('(e)=>e===document.activeElement'))
        page.locator('#command-input').fill('Preserve this draft')
        state('solving');page.locator('[data-place="right"]').click();page.locator('[data-platform="mac"]').click()
        check('draft persists across state platform and placement',lambda:snap()['draft']=='Preserve this draft')
        check('native Mac switch is honestly a layout reference',lambda:'Native macOS layout reference'==page.locator('#platform-label').inner_text())
        page.locator('[data-place="center"]').click();page.locator('[data-platform="windows"]').click()
        state('typing');page.locator('#command-input').fill('line one');page.locator('#command-input').press('Shift+Enter');page.locator('#command-input').press('a')
        check('Shift+Enter preserves multiline draft',lambda:'\n' in snap()['draft'] and snap()['state']=='typing')
        def ime():
            page.locator('#command-input').fill('écriture 日本語')
            page.locator('#command-input').dispatch_event('compositionstart')
            page.locator('#command-input').dispatch_event('keydown',{'key':'Enter','isComposing':True})
            assert snap()['state']=='typing'
            page.locator('#command-input').dispatch_event('compositionend')
            page.locator('#command-input').press('Enter')
            assert snap()['state']=='solving'
            return 'Composition Enter did not submit; explicit later Enter displayed inert text.'
        check('IME composition does not submit prematurely',ime)
        def inert():
            state('typing');text='<img src=x onerror="window.__bad=true"> & close.exe'
            page.locator('#command-input').fill(text);page.locator('#action-submit').click()
            assert page.locator('#caption').inner_text()==text
            assert page.locator('#caption img').count()==0 and page.evaluate('window.__bad===undefined')
            return 'Literal HTML remains text. No arbitrary code or application execution.'
        check('typed HTML and shell-like text remain inert',inert)
        state('typing');page.locator('#command-input').fill('')
        for scenario,expected in [('open','completed'),('close','approval'),('correction','cancelled'),('outage','offline'),('repeat-wake','completed')]:
            def scenario_test(sc=scenario,ex=expected):
                page.locator('#scenario').select_option(sc);page.locator('#play-sequence').click()
                page.clock.fast_forward(8500)
                page.wait_for_function('(s)=>MetisDemo.snapshot().state===s',arg=ex,timeout=8000)
                assert snap()['timers']==0,snap()
                return {'scenario':sc,'final_state':ex,'timers_remaining':0}
            check('scripted sequence '+scenario,scenario_test)
        def cancel_test():
            page.locator('#scenario').select_option('open');page.locator('#play-sequence').click();page.clock.fast_forward(800)
            page.locator('#command-input').focus();page.keyboard.press('Escape');g=snap()['generation'];page.clock.fast_forward(5400)
            assert snap()['state']=='cancelled' and snap()['timers']==0 and snap()['generation']==g
            return 'All scheduled old-generation callbacks cancelled.'
        check('Stop prevents delayed sequence completion',cancel_test)
        def replacement():
            page.locator('#play-sequence').click();page.clock.fast_forward(700)
            page.locator('#scenario').select_option('outage');page.locator('#play-sequence').click()
            page.clock.fast_forward(6500)
            page.wait_for_function('()=>MetisDemo.snapshot().state==="offline"',timeout=6000)
            page.clock.fast_forward(2600)
            assert snap()['state']=='offline' and snap()['timers']==0
            return 'Superseded playback did not overwrite the replacement.'
        check('repeated playback respects generation ownership',replacement)
        state('approval')
        check('approval requires a deliberate preview action',lambda:page.locator('#approval-buttons').is_visible() and snap()['timers']==0)
        capture('02-approval-desktop.png')
        page.locator('#approve').click()
        check('approval never claims a real application was closed',lambda:'No application is being closed' in page.locator('#result-detail').inner_text())
        state('answer')
        check('long answer has its own bounded scroll area',lambda:page.locator('#answer-body').evaluate('(e)=>e.scrollHeight>e.clientHeight && getComputedStyle(e).overflowY==="auto"'))
        def paused(control):
            state('solving');page.locator(control).check();page.clock.fast_forward(200)
            a=snap();page.clock.fast_forward(250);b=snap()
            assert not b['animationActive'] and a['frames']==b['frames'],(a,b)
            page.locator(control).uncheck()
            return 'Canvas clock stopped; static state retained.'
        check('manual pause stops animation work',lambda:paused('#pause-animation'))
        check('reduced-motion option stops animation work',lambda:paused('#reduced-motion'))
        def system_rm():
            page.emulate_media(reduced_motion='reduce');state('solving');page.clock.fast_forward(200)
            a=snap();page.clock.fast_forward(250);b=snap();assert not b['animationActive'] and a['frames']==b['frames']
            page.emulate_media(reduced_motion='no-preference')
            return 'Operating-system media preference is honored.'
        check('system reduced-motion preference',system_rm)
        def hidden():
            state('solving');page.locator('[data-tab="settings"]').click();page.clock.fast_forward(200)
            a=snap();page.clock.fast_forward(250);b=snap();assert not b['animationActive'] and a['frames']==b['frames']
            return 'Hidden experience has no recurring canvas frames.'
        check('inactive product tab stops experience animation',hidden)
        for key in ['general','voice','knowledge','privacy','advanced']:
            def sett(k=key):
                page.locator(f'[data-settings="{k}"]').click()
                return page.locator('.setting-row').count()>=3 and page.locator(f'[data-settings="{k}"]').get_attribute('aria-selected')=='true'
            check('settings destination '+key,sett)
        page.locator('[data-settings="voice"]').click();capture('03-settings-desktop.png')
        page.locator('[data-tab="intelligence"]').click();page.locator('#show-evidence').click()
        check('Intelligence evidence drawer stays synthetic',lambda:page.locator('#evidence-note').is_visible() and 'No real meeting' in page.locator('#evidence-note').inner_text())
        capture('04-intelligence-desktop.png')
        page.locator('[data-tab="operator"]').click()
        check('Operator does not present real connected services',lambda:page.locator('.ops-table').inner_text().count('Not connected in lab')==2 and 'No meeting joined' in page.locator('.ops-table').inner_text())
        capture('05-operator-desktop.png')
        page.locator('[data-tab="experience"]').click();state('listening')
        page.locator('[data-place="right"]').click()
        capture('06-listening-right-edge.png')
        def small():
            page.set_viewport_size({'width':390,'height':844});state('typing')
            page.locator('#command-input').fill('A longer multi-line request with an unbroken identifier '+('longidentifier'*6))
            page.clock.fast_forward(100)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
            box=page.locator('.pill').bounding_box()
            assert box['x']>=0 and box['x']+box['width']<=390+1,box
            assert page.locator('#action-submit').is_visible()
            return {'viewport':[390,844],'overflow':False,'bar_width':round(box['width'],1)}
        check('narrow 390px long-text layout retains controls',small)
        check('narrow playback control does not stack each word',lambda:page.locator('#play-sequence').bounding_box()['height']<65)
        capture('07-narrow-typing.png')
        page.set_viewport_size({'width':1460,'height':1040});page.locator('#command-input').fill('');state('solving');page.locator('[data-place="center"]').click()
        page.locator('#theme').select_option('light')
        check('light visual theme toggles',lambda:page.locator('html').get_attribute('data-theme')=='light')
        capture('08-light-desktop.png');page.locator('#theme').select_option('dark')
        for st,name in [('armed','10-armed-desktop.png'),('off','11-microphone-off.png'),('offline','12-cloud-unavailable.png'),('privacy-blocked','13-privacy-blocked.png'),('answer','14-expanded-answer.png')]:
            state(st);capture(name)
        check('main demo has no runtime exceptions',lambda:not errors)
        # Original module is preserved as a historical visual study, not the old full contract.
        load('visual/original-command-preview.html')
        for sid in ['listening','solving','approval','verified','off']:
            def original(s=sid):
                page.locator(f'button[data-state="{s}"]').click()
                return page.locator('#command-stage').get_attribute('data-phase')==s
            check('original HTML preserved state '+sid,original)
        check('original reference orb is embedded locally',lambda:page.locator('img.orb').get_attribute('src').startswith('data:image/png;base64,'))
        load('OPEN-METIS-2.html')
        check('single-file kit entry boots current visual lab',lambda:snap()['phase']=='ARMED')
        check('kit entry displays current complete scope',lambda:'112 use cases' in page.locator('body').inner_text() and '66 tasks' in page.locator('body').inner_text())
        capture('09-kit-entry.png')
        check('no actual web requests from loaded demos',lambda:len([u for u in requests if u.startswith(('https:','http:','ws:','wss:'))])==0)
        check('all loaded demo documents have no JS exceptions',lambda:not errors)
        report={'scope':'SYNTHETIC_DELIVERY_KIT_UI_ONLY','executed_at':datetime.now(timezone.utc).isoformat(),'engine':'Chromium','version':browser.version,'host':platform.system(),'render_mode':'Playwright page.set_content in-memory document with controlled browser clock; NOT a real-time benchmark','not_tested':['Native Windows/macOS application','Microphone or wake detection','Real Libraries.dev packages/React adapter compilation','Cloudflare/Jev/Laya/Dust/Teams services','Signing or installer behavior','file:// or loopback navigation in this policy-restricted environment'], 'requests_observed':requests,'page_errors':errors,'checks':checks,'screenshots':shots,'passed':all(c['passed'] for c in checks)}
        browser.close()
    out=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.report:args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(out,encoding='utf-8')
    print(out)
    return 0 if report['passed'] else 1
if __name__=='__main__':sys.exit(main())
