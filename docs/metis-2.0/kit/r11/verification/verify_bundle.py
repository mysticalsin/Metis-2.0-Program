#!/usr/bin/env python3
"""Read-only standard-library validation of the delivery kit, never a product release gate."""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        for k in ('href','src','poster'):
            if a.get(k):self.links.append(a[k])
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(root:Path,check_hashes=True):
    results=[]
    def check(name,passed,detail):results.append({'check':name,'passed':bool(passed),'detail':detail})
    try:r=json.loads((root/'plan/registry.json').read_text(encoding='utf-8'))
    except (OSError,ValueError) as e:return [{'check':'registry readable','passed':False,'detail':str(e)}]
    m=(root/'spec/MASTER.md').read_text(encoding='utf-8')
    expected={'requirements':55,'use_cases':112,'tasks':66,'owner_commitments':44,'golden_flows':12,'historical_findings':20}
    for k,n in expected.items():
        ids=[x['id'] for x in r[k]];check(k+' count and uniqueness',len(ids)==n and len(set(ids))==n,{'expected':n,'actual':len(ids)})
    check('canonical master hash',digest(root/'spec/MASTER.md')==r['source_sha256'],r['source_sha256'])
    uids={x['id'] for x in r['use_cases']};reqs={x['id'] for x in r['requirements']};tasks={x['id']:x for x in r['tasks']};fids={x['id'] for x in r['golden_flows']}
    master_ucs=set(re.findall(r'^\| (UC-\d{3}) \|',m,re.M))
    master_reqs=set(re.findall(r'^\| (M2-[A-Z0-9]+-\d{2}) \|',m,re.M))
    master_tasks=set(re.findall(r'^#### (TASK-\d{3}) —',m,re.M))
    check('master/registry exact identifier parity',master_ucs==uids and master_reqs==reqs and master_tasks==set(tasks),'All catalog IDs compared, not counts only.')
    check('full use-case sequence',uids=={f'UC-{i:03d}' for i in range(1,113)},'UC-001 through UC-112')

    parsed=Links();parsed.feed((root/'spec/MASTER.html').read_text(encoding='utf-8'))
    html_master=(root/'spec/MASTER.html').read_text(encoding='utf-8')
    check('current HTML contains every requirement/task/use-case identifier',all(x in html_master for x in uids|reqs|set(tasks)),'Current HTML, not the obsolete original 28-task specification.')

    covered=set().union(*(set(c['requirements']) for c in r['owner_commitments']))
    check('every requirement mapped to an owner commitment',covered==reqs,sorted(reqs-covered))
    broken=[]
    for group in ('owner_commitments','use_cases','historical_findings'):
        for item in r[group]:
            for x in item.get('tasks',[]):
                if x not in tasks:broken.append((item['id'],x))
            for x in item.get('requirements',[]):
                if x not in reqs:broken.append((item['id'],x))
            for x in item.get('flows',[]):
                if x not in fids:broken.append((item['id'],x))
    check('all mapped identifiers resolve',not broken,broken)
    check('every case has implementation and test lane',all(u['tasks'] and u['flows'] and u['requirements'] for u in r['use_cases']),'Per-case ownership preserved. Actual product tests remain NOT_TESTED.')
    taskfiles=[]
    for t in r['tasks']:
        p=root/f'plan/tasks/{t["id"]}.md'
        if not p.is_file() or t['body'] not in p.read_text(encoding='utf-8'):taskfiles.append(t['id'])
    check('66 exact task bodies preserved',not taskfiles,taskfiles)
    deps={k:{x.split('.')[0] for x in t['common_dependencies']} for k,t in tasks.items()}
    dangling=[(k,x) for k,v in deps.items() for x in v if x not in tasks]
    pending={k:set(v) for k,v in deps.items()};order=[]
    while pending:
        ready=sorted(k for k,v in pending.items() if not v)
        if not ready:break
        order.extend(ready)
        for k in ready:pending.pop(k)
        for v in pending.values():v.difference_update(ready)
    check('common prerequisite DAG',not dangling and not pending,{'unresolved':dangling,'cycles_or_blocked':list(pending),'tasks_sorted':len(order),'scope':'Common prerequisites only. Full platform/provider closures are preserved in SCOPE-HANDOFFS.md and require target-repo binding.'})
    states=json.loads((root/'visual/STATE-MAP.json').read_text(encoding='utf-8'))['states']
    check('visual state coverage',len(states)==14 and len({x['visual_id'] for x in states})==14,'14 mapped presentation states; not product passes.')
    armed=next(x for x in states if x['visual_id']=='armed')
    check('animated armed visual contract is orb-only',armed.get('visible_elements')==['orb'] and armed.get('default_animation')=='solving' and armed.get('hit_target_size')==72,'No idle pill, caption or glow; native hit testing remains a product gate.')
    source_ids=re.findall(r'^### (R\d{2,3}) ·',m,re.M)
    check('source reference IDs unique and indexed',len(source_ids)==len(set(source_ids)) and set(source_ids)=={x['id'] for x in r['references']}, {'count':len(source_ids)})
    check('current master contains animated owner refinement', '### 5.11 Orb-only ARMED state' in m and '**Revision:** 4.5' in m,'New visual rule is in the canonical master, not only a detached note.')
    adapter=(root/'integration/MetisCommandSurface.tsx').read_text()
    arm_branch=adapter.split("if (s.phase === 'armed')",1)[-1].split('return <section className="metis-command-surface"',1)[0]
    check('presentation reference has a separate compact branch', 'metis-armed-orb' in arm_branch and 'ThinkingOrb' in arm_branch and 'BorderBeam' not in arm_branch and 'VoiceBeam' not in arm_branch,'Static source check only; not a compiled product test.')
    check('root and visual lab use identical behavior', (root/'visual/src/demo.js').read_text() in (root/'OPEN-METIS-2.html').read_text(),'Same orb and lifecycle behavior in both entry points.')
    html_bad=[];duplicate=[];url_count=0;html_files=list(root.rglob('*.html'))
    parses={p:Links() for p in html_files}
    for p,parser in parses.items():parser.feed(p.read_text(encoding='utf-8'))
    for p,parser in parses.items():
        if len(parser.ids)!=len(set(parser.ids)):duplicate.append(str(p.relative_to(root)))
        for raw in parser.links:
            z=urlsplit(raw)
            if z.scheme or z.netloc:continue
            target=(p.parent/unquote(z.path)).resolve() if z.path else p.resolve()
            if not target.is_relative_to(root.resolve()) or not target.is_file():html_bad.append((str(p.relative_to(root)),raw));continue
            url_count+=1
            if z.fragment and target.suffix=='.html':
                q=parses.get(target)
                if q is None:q=Links();q.feed(target.read_text(encoding='utf-8'))
                if unquote(z.fragment) not in q.ids:html_bad.append((str(p.relative_to(root)),raw))
    check('HTML local paths and fragment targets',not html_bad,{'checked':url_count,'broken':html_bad,'external_urls':'Not fetched by this offline checker.'})
    check('HTML IDs unique',not duplicate,duplicate)
    sim=(root/'visual/index.html').read_text(encoding='utf-8')
    code=(root/'visual/src/demo.js').read_text(encoding='utf-8')
    forbidden=[x for x in ['navigator.mediaDevices','getUserMedia(','new WebSocket','XMLHttpRequest','fetch(','localStorage','sessionStorage','SpeechRecognition','sendBeacon('] if x in code]
    check('offline demo no capture/network/persistence APIs',not forbidden,forbidden)
    check('demo outbound requests denied by CSP',"connect-src 'none'" in sim and "media-src 'none'" in sim,'No simulated wake creates an external request.')
    check('simulator and source code match',code in sim and (root/'visual/src/demo.css').read_text(encoding='utf-8') in sim,'Self-contained HTML matches readable source assets.')
    check('launch prompt includes current scope','UC-001–UC-112' in (root/'CODEX-START.txt').read_text() and 'TASK-001–TASK-066' in (root/'CODEX-START.txt').read_text(),'No older 76-case cutoff.')
    status=json.loads((root/'plan/PRODUCT-STATUS.json').read_text())
    check('no fabricated product verification',status['product_verification']=='NOT_RUN' and all(t['verification']=='NOT_TESTED' and not t['evidence'] for t in status['tasks']),'Kit checks do not pre-fill product results.')
    ars=json.loads((root/'references/ASSET-INVENTORY.json').read_text())['assets'];changed=[]
    for a in ars:
        p=root/'references'/a['path']
        if not p.is_file() or digest(p)!=a['sha256']:changed.append(a['path'])
    check('original reference bytes intact',not changed,{'assets':len(ars),'changed':changed})
    fonts=[str(p.relative_to(root)) for p in root.rglob('*') if p.suffix.lower() in ('.ttf','.otf','.woff','.woff2','.eot')]
    check('no font files packaged',not fonts,fonts)
    syms=[str(p.relative_to(root)) for p in root.rglob('*') if p.is_symlink()]
    check('no symlinks packaged',not syms,syms)
    # These are handoff coverage checks, not executed product acceptance.
    ex=r.get('experience_requirements',[]);sf=r.get('source_findings',[])
    check('12 experience qualifications retained and mapped',len(ex)==12 and len({x['id'] for x in ex})==12 and all(x['tasks'] and all(t in tasks for t in x['tasks']) and x['acceptance'] and x['verification']=='NOT_TESTED' for x in ex),'EXP-01–12 require actual product evidence.')
    check('24 source findings retained and mapped',len(sf)==24 and len({x['id'] for x in sf})==24 and all(x['tasks'] and all(t in tasks for t in x['tasks']) and x['evidence'] and x['exit_evidence'] for x in sf),'Source findings are not production tests.')
    check('supplemental requirements occur in master and task records',all(x['id'] in m and all(x['id'] in tasks[t]['body'] for t in x['tasks']) for x in ex+sf),'No detached feature list without execution owners.')
    ix=json.loads((root/'source-review/SOURCE-INDEX.json').read_text());nodes=json.loads((root/'architecture/MAP-COVERAGE.json').read_text())
    check('export inventory and missing-source map remain honest',len(ix['sections'])==1521 and len({x['path'] for x in ix['sections']})==1521 and ix['source_commit'] is None and nodes['present']==14 and nodes['total']==19,'Source export is not a complete checkout or an inferred Git SHA.')
    e=(root/'visual/vendor/solving-engine.js').read_text();prov=json.loads((root/'visual/vendor/PROVENANCE.json').read_text())
    check('attributed solving engine is identical in both HTML views',e in sim and e in (root/'OPEN-METIS-2.html').read_text() and digest(root/'visual/vendor/solving-engine.js')==prov['local_sha256'],'Actual selected upstream mathematics, not installed npm/native proof.')
    check('upstream license and reviewed source identities retained','Copyright (c) 2026 Jakub Antalik' in (root/'visual/vendor/THINKING-ORBS-LICENSE.txt').read_text() and len(prov['reviewed_blobs'])==5,'MIT attribution and file-blob provenance.')
    meet=(root/'visual/meeting/index.html').read_text()
    check('meeting reference remains synthetic and content-safe',"connect-src 'none'" in meet and 'SYNTHETIC PREVIEW' in meet and 'No real CRM write occurred' in meet and not any(x in meet for x in ['getUserMedia(', 'fetch(', 'new WebSocket', 'localStorage','sessionStorage','sendBeacon(']),'No actual meeting, CRM, network or persistence API.')
    check('all source findings have current input identities',all(e['path'] in {z['path'] for z in ix['sections']} and len(e['normalized_sha256'])==64 for f in sf for e in f['evidence']),'Every cited source section comes from the indexed upload.')
    # New artifact-derived agent scope. These validate the handoff, never live services.
    ax=json.loads((root/'plan/AGENT-EXPANSION.json').read_text());hc=json.loads((root/'clicky-study/OBSERVATIONS.json').read_text())
    gates=ax['gates'];cases=ax['cases'];steps=ax['ordered_steps']
    gids={x['id'] for x in gates};hids={x['id'] for x in hc};stepids={x['id'] for x in steps}
    check('16 named-agent qualifications preserved',len(gates)==16 and gids=={f'AGX-{i:02d}' for i in range(1,17)} and all(x['verification']=='NOT_TESTED' and x['id'] in m and all(t in tasks for t in x['tasks']) and all(z in hids for z in x['source_observations']) for x in gates),'Separate expansion IDs preserve the original 55 requirements.')
    check('32 agent use cases have execution owners',len(cases)==32 and {x['id'] for x in cases}=={f'AGUC-{i:03d}' for i in range(1,33)} and all(x['gate'] in gids and x['tasks'] and x['expected'] and x['verification']=='NOT_TESTED' and x['id'] in m for x in cases),'Each individual scenario retains expected behavior; no product pass.')
    check('32 artifact observations are source-linked',len(hc)==32 and hids=={f'HC-{i:02d}' for i in range(1,33)} and all(x['evidence'] and x['evidence_level'] and x['tasks'] and all(t in tasks for t in x['tasks']) and x['product_verification']=='NOT_TESTED' for x in hc),'Packaged strings/instructions are distinct from runtime verification.')
    todo={x['id']:set(x['depends_on']) for x in steps};baddeps=[v for vs in todo.values() for v in vs if v not in stepids];sorted_steps=[]
    while todo:
        ready=sorted(k for k,v in todo.items() if not v)
        if not ready:break
        for k in ready:todo.pop(k);sorted_steps.append(k)
        for v in todo.values():v.difference_update(ready)
    check('18 numbered agent steps form a resolvable DAG',len(steps)==18 and len(stepids)==18 and not baddeps and not todo and all(x['gates'] and all(g in gids for g in x['gates']) and all(t in tasks for t in x['tasks']) and (root/f"plan/agent-slices/{x['id']}.md").is_file() for x in steps),{'sorted':sorted_steps,'remaining':list(todo)})
    check('agent expansion is bound to original task bodies',all(all(x['id'] in tasks[t]['body'] for t in x['tasks']) for x in gates+hc),'New scope is not a detached wish list.')
    check('registry and source observations agree exactly',r['agent_expansion']==ax and r['clicky_observations']==hc,'No separate registry can drift silently.')
    art=json.loads((root/'clicky-study/ARTIFACT.json').read_text());inv=json.loads((root/'clicky-study/BUNDLE-INVENTORY.json').read_text());disp=json.loads((root/'clicky-study/RESOURCE-DISPOSITIONS.json').read_text());seal=json.loads((root/'clicky-study/RESOURCE-SEAL-RESULT.json').read_text())
    paths={x['path'] for x in inv}
    check('HeyClicky inventory is byte-bound and non-executed',len(inv)==192 and len(paths)==192 and sum(x['bytes'] for x in inv)==art['extracted_regular_bytes'] and art['executed'] is False and art['system_signing_trust_checked'] is False and art['original_source_project_recovered'] is False,'Metadata readback is not native launch, code signing or recovered original source.')
    check('48 resource dispositions and 15 curated skills are explicit',len(disp)==48 and sum(x['path'].startswith('Contents/Resources/ClickyBundledSkills/') and x['path'].endswith('/SKILL.md') for x in disp)==15 and all(x['path'] in paths and x['copy_into_metis'] is False and x['activation']=='NOT_ESTABLISHED' and x['metis_disposition'] and x['tasks'] for x in disp),'No legacy guide is automatically promoted to working capability.')
    check('resource-hash matches are not signing trust',seal['checked']==127 and seal['passed']==127 and 'NOT verified' in seal['scope'],'127 matching resource hashes only; no Apple certificate/notarization test.')
    agentpage=(root/'visual/agents/index.html').read_text();agentjs=(root/'visual/agents/src/agents.js').read_text();agentcss=(root/'visual/agents/src/agents.css').read_text()
    check('new agents HTML exactly embeds its readable sources',agentjs in agentpage and agentcss in agentpage and e in agentpage,'Current source-derived orb reference reused without remote assets.')
    badagent=[x for x in ['getUserMedia(', 'fetch(', 'new WebSocket','XMLHttpRequest','localStorage','sessionStorage','sendBeacon('] if x in agentjs]
    check('agents reference has no external capture or persistence',not badagent and "connect-src 'none'" in agentpage and "media-src 'none'" in agentpage and 'SIMULATED · NO MICROPHONE OR BACKEND' in agentpage,badagent)
    check('current launch includes the full new named-agent scope',all(x in (root/'CODEX-START.txt').read_text() for x in ['AGX-01–16','AGUC-001–032','HC-01–32','AGSTEP-01–18','visual/agents/index.html']),'Original 66 task sequence is retained.')
    unsafe=[str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and (p.suffix.lower() in ['.dmg','.node','.dylib','.exe'] or p.name in ['ClickyModelInstructions.md','ClickyWelcomeVideo.mp4'])]
    check('reference application binaries and prompts not redistributed',not unsafe,unsafe)
    # r10 consolidation and actual-source collaboration requirements.
    launch=(root/'CODEX-START.txt').read_text(); entry=(root/'START-HERE.md').read_text()
    check('current complete contract is revision 4.5',r.get('product_contract_revision')=='4.5' and r.get('package_edition')=='r11' and '**Revision:** 4.5' in m and 'revision **4.5**' in entry,'One authoritative contract, not an amendment left beside a contradictory wizard.')
    check('full collaboration and onboarding sections integrated','## 33.' in m and '## 34.' in m and all(f'OBU-{i:02d}' in m for i in range(1,6)) and 'OBU-01–05' in launch,'All original IDs and new owner-directed integration slices retained.')
    generated=(root/'plan/AGENT-EXPERIENCE.md').read_text()
    expected_section=m[m.index('## 32.'):m.index('## 33.')].strip()
    check('derived agent experience matches current master',expected_section in generated and 'Eight stages' not in generated,'No stale replacement onboarding in the task-facing derivative.')
    media=json.loads((root/'onboarding/media/tony-walteur.manifest.json').read_text())
    check('only Tony Walteur is the onboarding presenter',media.get('presenter')=='Tony Walteur' and media.get('allowedNamedHumans')==['Tony Walteur'],'Human approval of the actual film remains required.')
    check('missing authentic video never fabricates an asset',media.get('status')=='NOT_PROVIDED' and media.get('video') is None and media.get('poster') is None and media['runtime']['externalFallback'] is None,'Complete text-led welcome, no substitute presenter or old fallback.')
    onboarding_js=(root/'onboarding/preview/app.js').read_text()
    check('active onboarding preserves the Metis sequence',"['hero','problem','reveal','appearance','setup','personalize','ready']" in onboarding_js and 'hero → problem → reveal → appearance → setup → personalize' in m,'Existing optional license branch remains in the real product; Ready consent remains required.')
    check('agent workspace no longer replaces onboarding',"view:'home'" in agentjs and 'Choose agents' in agentjs and 'Account & policy' not in agentjs and '../../onboarding/preview/index.html' in agentpage,'Single optional naming sheet only; not an eight-step tour.')
    snap=root/'references/source/metis-1.9.5-export.txt'
    check('bundled source snapshot matches original supplied bytes',snap.is_file() and digest(snap)==ix['source_sha256'] and snap.stat().st_size==ix['source_bytes'],'Read-only incomplete export, not a cloned current repository.')
    tool=(root/'tools/dual_agent.py').read_text()
    check('dual-agent tool requires explicit source egress and CLI policy approval','authorize_source_egress' in tool and 'confirm_reviewed_cli_configuration' in tool and 'shell=False' in tool and 'product_release_approved' in tool and not any(x in tool for x in ['--dangerously-skip-permissions','--yolo','npm install']),'No automatic installation, permission bypass or release permission.')
    check('review tooling binds source and rejects false test claims',all(x in tool for x in ['master_sha256','task_contract_sha256','changed_files','Prompt changed','Changed files remain unreviewed','Read-only review cannot claim test execution']),'Consistency checks require actual independent session receipts; not an authenticity oracle.')
    check('Codex and Fable entry instructions both present',all((root/x).is_file() for x in ['FABLE-START.txt','CLAUDE.md','collaboration/README.md','collaboration/REVIEW-FORMAT.json','delivery/RUN-ORDER.md']) and 'FABLE-START.txt' in launch and 'TASK-001' in launch,'Actual account/model access is a qualification, never silently simulated.')
    form=json.loads((root/'collaboration/REVIEW-FORMAT.json').read_text())
    check('review format cannot be mistaken for a pass',form['verdict']=='BLOCKED' and form['reviewer']['independent'] is False and form['head_commit'] is None and not form['tests_executed'],'Unfilled evidence format, not a claimed review.')
    reader=(root/'tools/read_task.py').read_text()
    check('bounded reader reaches both new sections','a.section<=35' in reader and '## 33.' in m and '## 34.' in m and '## 35.' in m,'Collaboration and retained onboarding are addressable without loading the entire document.')
    # r11: source-grounded memory components and mapped delivery, not a deployed product.
    mem=json.loads((root/'memory/EXPANSION.json').read_text()); sources=json.loads((root/'memory/SOURCES.json').read_text())
    mg={g['id']:g for g in mem['gates']}; ms={x['id']:x for x in mem['steps']}; muc={x['id']:x for x in mem['use_cases']}
    check('16 Hindsight qualifications are unique and owned',set(mg)=={f'HM-{i:02d}' for i in range(1,17)} and all(g['tasks'] and all(t in tasks for t in g['tasks']) and g['product_verification']=='NOT_TESTED' for g in mg.values()),'Additional memory gates do not replace baseline requirements.')
    check('32 memory cases have mapped acceptance',set(muc)=={f'HMUC-{i:03d}' for i in range(1,33)} and all(c['expected'] and c['tasks'] and all(g in mg for g in c['gates']) and c['product_verification']=='NOT_TESTED' for c in muc.values()),'Explicit scope, correction, provider, audience and failure behavior.')
    todo={k:set(v['depends_on']) for k,v in ms.items()}; invalid=[d for deps in todo.values() for d in deps if d not in ms]; sorted_mem=[]
    while todo:
        ready=sorted(k for k,v in todo.items() if not v)
        if not ready:break
        for k in ready:todo.pop(k);sorted_mem.append(k)
        for v in todo.values():v.difference_update(ready)
    check('16 numbered memory slices form a DAG',set(ms)=={f'HMSTEP-{i:02d}' for i in range(1,17)} and not invalid and not todo and all((root/f'memory/steps/{i}.md').is_file() for i in ms),{'order':sorted_mem,'unresolved':invalid,'blocked':list(todo)})
    check('memory scope is integrated into actual task bodies',all(all(g['id'] in tasks[t]['body'] for t in g['tasks']) for g in mg.values()) and r.get('memory_expansion')==mem,'Not a detached wish list or different task sequence.')
    contract=(root/'memory/INTEGRATION-CONTRACT.md').read_text()
    check('canonical master contains the complete memory contract',contract.strip() in m and '## 35.' in m and all(i in m for i in set(mg)|set(ms)|set(muc)),'One master authority and bounded derived section.')
    check('new launch instructions cover memory and collaborator',all(t in launch for t in ['HM-01–16','HMUC-001–032','HMSTEP-01–16','memory/BINDINGS.md']) and 'Hindsight' in (root/'FABLE-START.txt').read_text(),'Real production binding review, not fixture review.')
    live=json.loads((root/'memory/LIVE-STATUS.json').read_text())
    check('no invented live Hindsight proof',live['service_deployment']=='NOT_RUN' and live['actual_hindsight_smoke']=='NOT_RUN' and live['native_windows_e2e']=='NOT_RUN' and live['native_mac_e2e']=='NOT_RUN','Offline checks never turn into application/live-service receipts.')
    check('Hindsight source review is pinned and qualified',sources['upstream_ref']=='b88458fd6b96e70069238f7df5a0e2f1c3c9240c' and sources['deployed_version'] is None and len(sources['observations'])==18 and len(sources['sources'])==14,'Primary-source review, not full repository/deployment certification.')
    transport=(root/'memory/src/hindsight-client.mjs').read_text(); gateway=(root/'memory/src/memory-gateway.mjs').read_text()
    check('memory transport uses explicit safe request profile',all(x in transport for x in ["tags_match: 'all_strict'", "trace: false", "update_mode: 'replace'", "observation_scopes: 'combined'", "exclude_mental_models: true", "redirect: 'error'", "SOURCE_TIME_REQUIRED"]),'Static tripwires accompany executable tests; not a formal security proof.')
    check('memory output checks source authority and revocation',all(x in gateway for x in ['assertFresh','resolveEvidence','blockSource','markReconciliation','CONTEXT_ONLY_NEVER_INSTRUCTIONS','permitsAction: false','SOURCE_NOT_ELIGIBLE']),'Real identity/repository implementations still required; no in-memory authentication stub ships here.')
    profile=json.loads((root/'memory/deploy/profile.template.json').read_text()); env=profile['environment']
    check('private deployment profile denies extra content stores',all(env.get(k)=='false' for k in ['HINDSIGHT_API_STORE_DOCUMENT_TEXT','HINDSIGHT_API_LLM_TRACE_ENABLED','HINDSIGHT_API_OTEL_TRACES_ENABLED','HINDSIGHT_API_MCP_ENABLED','HINDSIGHT_API_ENABLE_FILE_UPLOAD_API','HINDSIGHT_API_ENABLE_DOCUMENT_EXPORT_API','HINDSIGHT_API_ENABLE_DOCUMENT_IMPORT_API']) and profile['publicIngress'] is False and profile['databasePublic'] is False,'Real effective configuration still needs readback and sentinel tests.')
    check('unprovided hosting approvals do not pretend readiness','REQUIRED' in profile['image'] and profile['region']=='REQUIRED' and not any(profile['approvedStages'].values()),'No guessed production image, region, account or approval.')
    memoryhtml=(root/'memory/visual/index.html').read_text(); memoryjs=(root/'memory/visual/memory.js').read_text(); memorycss=(root/'memory/visual/memory.css').read_text()
    bad=[t for t in ['fetch(', 'XMLHttpRequest', 'getUserMedia(', 'new WebSocket', 'localStorage', 'sessionStorage', 'sendBeacon('] if t in memoryjs]
    check('embedded-memory preview is a bounded offline fixture',memoryjs in memoryhtml and memorycss in memoryhtml and not bad and "connect-src 'none'" in memoryhtml and 'NO BACKEND' in memoryhtml,{'unexpected_apis':bad})
    check('memory preview is linked from full entry point','memory/visual/index.html' in (root/'OPEN-METIS-2.html').read_text() and (root/'tools/read_memory_step.py').is_file(),'Preserves original animated command and named-agent contexts.')
    if check_hashes:
        try:
            manifest=json.loads((root/'verification/CHECKSUMS.json').read_text())
            entries=manifest['files'];bad=[]
            for rel,want in entries.items():
                safe=PurePosixPath(rel)
                if safe.is_absolute() or '..' in safe.parts or '\\' in rel:
                    bad.append(rel);continue
                p=root/rel
                if p.is_symlink() or not p.resolve().is_relative_to(root.resolve()):
                    bad.append(rel);continue
                if not p.is_file() or digest(p)!=want['sha256'] or p.stat().st_size!=want['bytes']:bad.append(rel)
            actual={str(p.relative_to(root)).replace('\\','/') for p in root.rglob('*') if p.is_file() and p != root/'verification/CHECKSUMS.json' and '__pycache__' not in p.parts}
            check('complete package checksum manifest',not bad and actual==set(entries),{'files':len(entries),'mismatched':bad,'unlisted':sorted(actual-set(entries)),'missing':sorted(set(entries)-actual)})
        except (OSError,ValueError) as e:check('complete package checksum manifest',False,str(e))
    return results

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--skip-hashes',action='store_true',help='Development structural check only. Default also verifies all bundled file hashes.')
    a=p.parse_args();checks=validate(a.root.resolve(),not a.skip_hashes)
    print(json.dumps({'scope':'DELIVERY_KIT_ONLY_NOT_PRODUCT','passed':all(x['passed'] for x in checks),'checks':checks},ensure_ascii=False,indent=2))
    return 0 if all(x['passed'] for x in checks) else 1
if __name__=='__main__':sys.exit(main())
