"""Browser checks for the ACTUAL patched demo in explicit isolated child fixtures.
Requires Python Playwright and Chromium; no network request is made by this fixture.
Different React/runtime versions from the app: see evidence/browser-results.json.
"""
import argparse
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright, expect as pw_expect
local_browser = Path(__file__).resolve().parent / "fixture"
browser_cases = []
layout_details = []

async def load_fixture(width=1000,height=760,reduced_motion="no-preference",baseline=False,controlled=True):
    ctx=await browser.new_context(viewport={"width":width,"height":height},reduced_motion=reduced_motion)
    pg=await ctx.new_page()
    errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    if controlled:
        await pg.clock.install()
    shell=(local_browser/'index.html').read_text()
    shell=re.sub(r'<link[^>]+>','',shell)
    shell=re.sub(r'<script[^>]+></script>','',shell)
    await pg.set_content(shell)
    await pg.add_style_tag(content=(local_browser/'utilities.css').read_text())
    await pg.add_script_tag(content=(local_browser/'react-local.js').read_text())
    target=local_browser/('demo-app-baseline.js' if baseline else 'demo-app.js')
    await pg.add_script_tag(content=target.read_text())
    await pg.get_by_role('button',name='Next',exact=True).wait_for(timeout=3000)
    return ctx,pg,errs

async def record_case(name, fn, **kwargs):
    ctx,pg,errs=await load_fixture(**kwargs)
    try:
        await fn(pg)
        browser_cases.append({"name":name,"status":"passed","page_errors":errs.copy()})
    except Exception as e:
        browser_cases.append({"name":name,"status":"failed","detail":str(e),"page_errors":errs.copy()})
    finally:
        await ctx.close()

async def nav_case(pg):
    assert await pg.get_by_role("button",name="Previous",exact=True).is_disabled()
    for step in range(1,5):
        assert f"Step {step} of 4:" in await pg.locator('[aria-atomic="true"]').inner_text()
        await pg.get_by_role("button",name="Next",exact=True).click()
    await pg.locator('#appearance-reached').wait_for(timeout=2000)
    assert await pg.evaluate('fixture.continued')==1
    assert await pg.evaluate('fixture.guard') is False
    assert await pg.evaluate('fixture.mediaCalls')==4

async def media_failure_case(pg):
    await pg.evaluate('fixture.mediaFailure=true')
    await pg.get_by_role("button",name="Next",exact=True).click()
    assert "Step 2 of 4:" in await pg.locator('[aria-atomic="true"]').inner_text()
    assert await pg.evaluate('fixture.mediaCalls')==1

async def setup_case(pg):
    await pg.get_by_role("button",name="Set me up",exact=True).focus()
    await pg.keyboard.press('Enter')
    await pg.locator('#appearance-reached').wait_for(timeout=2000)
    assert await pg.evaluate('fixture.continued')==1

async def pause_case(pg):
    await pg.clock.fast_forward(700)
    await pg.get_by_role("button",name="Pause demo",exact=True).focus()
    await pg.keyboard.press("Space")
    await pw_expect(pg.get_by_role('button',name='Resume demo',exact=True)).to_have_attribute('aria-pressed','true')
    before=await pg.get_by_test_id('copilot').inner_text()
    await pg.clock.fast_forward(60000)
    assert await pg.get_by_test_id('copilot').inner_text()==before
    await pg.get_by_role('button',name='Resume demo',exact=True).click()
    await pg.clock.fast_forward(2000)
    await pg.wait_for_function("(previous)=>document.querySelector('[data-testid=copilot]').innerText!==previous",arg=before,timeout=2000)

async def replay_case(pg):
    await pg.clock.fast_forward(20000)
    await pw_expect(pg.locator('[aria-atomic="true"]')).to_contain_text('Step complete.')
    await pg.get_by_role("button",name="Replay this step",exact=True).click()
    await pw_expect(pg.locator('[aria-atomic="true"]')).to_contain_text('Playing.')
    await pg.get_by_role("button",name="Next",exact=True).click()
    await pw_expect(pg.locator('[aria-atomic="true"]')).to_contain_text('Step 2 of 4:')
    await pg.get_by_role("button",name="Previous",exact=True).click()
    await pw_expect(pg.locator('[aria-atomic="true"]')).to_contain_text('Step 1 of 4:')

async def crash_case(pg):
    await pg.evaluate("fixture.crashPreview=true; remountFixture()")
    await pw_expect(pg.get_by_role('alert')).to_be_visible()
    assert await pg.get_by_role('button',name='Next',exact=True).is_enabled()
    await pg.evaluate('fixture.crashPreview=false')
    await pg.get_by_role('button',name='Replay this step',exact=True).click()
    await pw_expect(pg.get_by_role('alert')).to_have_count(0)
    await pw_expect(pg.get_by_test_id('copilot')).to_be_visible()
    await pg.evaluate("fixture.crashPreview=true; remountFixture()")
    await pw_expect(pg.get_by_role('alert')).to_be_visible()
    await pg.get_by_role('button',name='Set me up',exact=True).click()
    await pg.locator('#appearance-reached').wait_for(timeout=2000)

async def reduced_case(pg):
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Animation off.')
    assert await pg.get_by_role('button',name='Pause demo',exact=True).count()==0
    before=await pg.get_by_test_id('copilot').inner_text()
    assert len(before)>20
    await pg.clock.fast_forward(60000)
    assert await pg.get_by_test_id('copilot').inner_text()==before
    await pg.emulate_media(reduced_motion='no-preference')
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Step complete.')
    assert await pg.get_by_role('button',name='Pause demo',exact=True).is_disabled()
    await pg.get_by_role('button',name='Next',exact=True).click()
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Step 2 of 4:')
    await pg.emulate_media(reduced_motion='reduce')
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Animation off.')

async def visibility_case(pg):
    await pg.clock.fast_forward(700)
    await pg.evaluate("""Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.testHidden?'hidden':'visible'});
      window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));""")
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Paused while')
    before=await pg.get_by_test_id('copilot').inner_text()
    await pg.clock.fast_forward(60000)
    assert await pg.get_by_test_id('copilot').inner_text()==before
    await pg.evaluate("window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'))")
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Playing.')
    await pg.get_by_role('button',name='Pause demo',exact=True).click()
    await pg.evaluate("window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'))")
    await pg.clock.fast_forward(10000)
    await pg.evaluate("window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'))")
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Paused. Resume')
    await pw_expect(pg.get_by_role('button',name='Resume demo',exact=True)).to_have_attribute('aria-pressed','true')

async def mode_case(pg):
    await pw_expect(pg.get_by_role('button',name='General',exact=True)).to_have_attribute('aria-pressed','true')
    await pg.get_by_role('button',name='Sales',exact=True).click()
    await pw_expect(pg.get_by_role('button',name='Sales',exact=True)).to_have_attribute('aria-pressed','true')
    await pw_expect(pg.get_by_role('button',name='General',exact=True)).to_have_attribute('aria-pressed','false')
    assert await pg.evaluate('fixture.guard') is True
    await pg.evaluate("unmountFixture()")
    await pg.clock.fast_forward(60000)
    assert await pg.evaluate('fixture.guard') is False
    assert await pg.evaluate('fixture.guardChanges')==[True,False]

async def compact_case(pg):
    # Exercise the longest demo stage, not just its initial blank frame.
    for _ in range(3):
        await pg.get_by_role('button',name='Next',exact=True).click()
    await pw_expect(pg.locator('[aria-atomic=true]')).to_contain_text('Step 4 of 4:')
    await pg.clock.fast_forward(30000)
    box=await pg.get_by_role('group',name='Continue onboarding',exact=True).bounding_box()
    dimensions=await pg.evaluate("""({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight})""")
    assert dimensions['sw']<=dimensions['w']+1
    assert dimensions['sh']<=dimensions['h']+1
    assert box['y']>=0 and box['y']+box['height']<=dimensions['h']+1
    await pg.get_by_role('button',name='Next',exact=True).click()
    assert await pg.locator('#appearance-reached').count()==1
    layout_details.append({"viewport":dimensions,"navigation_box":box})
async def main():
    global browser, pw
    parser=argparse.ArgumentParser()
    parser.add_argument("--chromium",default="/usr/bin/chromium")
    parser.add_argument("--container-no-sandbox",action="store_true",
                        help="Only for isolated root-owned test containers, never the user Electron app.")
    parser.add_argument("--report",type=Path,default=Path("browser-recheck.json"))
    args=parser.parse_args()
    pw=await async_playwright().start()
    browser=await pw.chromium.launch(executable_path=args.chromium,headless=True,
                                     args=["--no-sandbox"] if args.container_no_sandbox else [])
    negative=[]
    try:
        await record_case("four user-controlled Next steps reach continuation once and release demo guard",nav_case)
        await record_case("synchronous optional-media failure does not intercept Next",media_failure_case)
        await record_case("keyboard Enter on Set me up reaches continuation",setup_case)
        await record_case("keyboard pause/resume freezes actual projected text for sixty seconds",pause_case,width=390,height=500)
        await record_case("hold/replay and Previous reset to the selected step",replay_case)
        await record_case("preview render failure leaves navigation live; replay recovers a cleared failure",crash_case)
        await record_case("reduced motion displays settled step and a setting change does not auto-replay",reduced_case,reduced_motion="reduce")
        await record_case("simulated visibility events exclude hidden time and preserve explicit user pause",visibility_case)
        await record_case("selected role is exposed; unmount releases the demo guard",mode_case)
        for w,h in [(390,500),(320,480),(768,500),(1000,760)]:
            await record_case(f"recap navigation reachable without document overflow at {w}x{h}",compact_case,width=w,height=h)
        ctx,pg,errors=await load_fixture(baseline=True)
        await pg.evaluate("fixture.mediaFailure=true")
        await pg.get_by_role("button",name="Next",exact=True).click()
        negative.append({"name":"original media exception intercepts Next",
                         "reproduced":len(errors)>0 and await pg.evaluate("fixture.continued")==0,
                         "page_errors":errors.copy()})
        await ctx.close()
        result={"cases":browser_cases,"negative_controls":negative,"layouts":layout_details,
                "limits":["Isolated child/shell fixtures, actual modified React component",
                          "Not packaged Electron, current pinned runtime, complete app styles or native QA"]}
        args.report.write_text(json.dumps(result,indent=2)+"\n")
        failed=[row for row in browser_cases if row["status"]!="passed"]
        print(f'{len(browser_cases)-len(failed)}/{len(browser_cases)} browser cases passed; fixture boundaries recorded.')
        if failed or not all(row["reproduced"] for row in negative):
            raise SystemExit(1)
    finally:
        await browser.close()
        await pw.stop()

if __name__=="__main__":
    asyncio.run(main())
