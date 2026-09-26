'use strict'
const fs=require('fs'),path=require('path'),ts=require(process.env.TYPESCRIPT_PATH||'typescript')
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3])
const stage=process.env.METIS_DEMO_STAGE||'overlay'
const modulePaths=[
 'src/renderer/src/components/OnboardingDemoScene.tsx',
 'src/renderer/src/components/OnboardingDemoPreviewBoundary.tsx',
 'src/renderer/src/lib/onboarding-demo-controls.ts'
]
const actual=new Map()
for(const p of modulePaths){
 const loc=path.join(root,stage,p);
 if(fs.existsSync(loc))actual.set(p,fs.readFileSync(loc,'utf8'));
 else if(stage==='overlay')throw Error('Missing production module '+p)
}
for(const p of ['src/renderer/src/lib/onboarding-demo.ts','src/renderer/src/lib/synthetic-cursor.ts'])
 actual.set(p,fs.readFileSync(path.join(root,'reference',p),'utf8'));
let js=`(() => {\nconst React=window.React, ReactDOM=window.ReactDOM;\nconst factories={},cache={};\n`
for(const [p,source]of actual){
 const result=ts.transpileModule(source,{fileName:p,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}});
 const errors=result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errors.length)throw Error(p+': '+errors.map(e=>e.messageText).join(','));
 js+=`factories[${JSON.stringify(p)}]=function(require,module,exports){\n${result.outputText}\n};\n`;
}
js+=`
window.fixture = {continued:0, mediaCalls:0, mediaFailure:false, crashPreview:false, guard:false, guardChanges:[], renders:0};
const F=window.fixture;
const h=React.createElement;
function checked(content) {
 if(F.crashPreview) throw Error('synthetic preview failure');
 return content;
}
const stubs={
 react:React,
 '@shared/ipc':{CONVERSATION_MODES:['general','sales','recruiting'],BUILTIN_MODE_LABELS:{general:'General',sales:'Sales',recruiting:'Recruiting'}},
 'src/renderer/src/components/Bar.ts':{Bar:props=>checked(h('section',{'data-testid':'real-preview-slot',className:'preview-box'},props.body))},
 'src/renderer/src/components/QuickActions.ts':{QuickActions:()=>h('div',{className:'demo-chips'},
   h('button',{'aria-label':'What to say next',type:'button'},'What to say next'),
   h('button',{'aria-label':'Fact-check',type:'button'},'Fact-check'))},
 'src/renderer/src/components/Answer.ts':{Answer:props=>checked(h('article',{'data-testid':'answer'},props.text))},
 'src/renderer/src/components/Copilot.ts':{Copilot:props=>checked(h('div',{'data-testid':'copilot'},props.lines.map((line,i)=>h('p',{key:i},line.text)),
   props.suggestion?h('p',{},props.suggestion.text):null))},
 'src/renderer/src/components/ModeRecap.ts':{ModeRecapView:props=>checked(h('article',{'data-testid':'recap'},h('h3',{},props.title),h('pre',{},props.sections))),
   modeRecapSections:md=>md},
 'src/renderer/src/lib/onboarding-demo-guard.ts':{setOnboardingDemoActive:active=>{F.guard=active;F.guardChanges.push(active)}},
 'src/renderer/src/lib/onboarding-demo-prefetch.ts':{prefetchOnboardingDemoChunks:()=>Promise.resolve()}
};
function resolve(from,id) {
 if(!id.startsWith('.'))return id;
 const parts=from.split('/');parts.pop();
 for(const part of id.split('/')){if(part==='..')parts.pop();else if(part!=='.')parts.push(part)}
 const p=parts.join('/');
 if(factories[p])return p;
 if(factories[p+'.tsx'])return p+'.tsx';
 return p.endsWith('.ts')?p:p+'.ts'
}
function req(id,from='') {
 const p=resolve(from,id);
 if(stubs[p])return stubs[p];
 if(cache[p])return cache[p].exports;
 if(!factories[p])throw Error('Unstubbed test-only dependency '+p);
 const mod=cache[p]={exports:{}};
 factories[p](next=>req(next,p),mod,mod.exports);
 return mod.exports
}
const Demo=req('src/renderer/src/components/OnboardingDemoScene.tsx').OnboardingDemoScene;
const root=ReactDOM.createRoot(document.getElementById('app'));
let selectedMode='general';
function mount() {
 F.renders++;
 root.render(h(Demo,{mode:selectedMode,
  onSetMode:mode=>{selectedMode=mode;mount()},
  onContinue:()=>{F.continued++;root.render(h('p',{id:'appearance-reached'},'Appearance callback reached (fixture)'))},
  onPlayVideo:()=>{F.mediaCalls++;if(F.mediaFailure)throw Error('synthetic optional media failure')}
 }));
}
window.remountFixture=mount;
window.unmountFixture=()=>root.unmount();
window.fixtureVersions={react:React.version,reactDOM:ReactDOM.version};
mount();
})();`
fs.writeFileSync(path.join(out,'demo-app.js'),js)
;(async()=>{
 const tw=require('tailwindcss');
 // These are real generated utilities; the outer test shell and chrome are explicit fixtures.
 const src=actual.get('src/renderer/src/components/OnboardingDemoScene.tsx')+
   (actual.get('src/renderer/src/components/OnboardingDemoPreviewBoundary.tsx')||'');
 const candidates=[...new Set(src.match(/[A-Za-z0-9_:/#.%()[\]-]+/g)||[])];
 const compiled=await tw.compile('@theme { --spacing: .25rem; --color-white: #fff; --color-black: #000; --text-center: center; } @tailwind utilities;');
 fs.writeFileSync(path.join(out,'utilities.css'),compiled.build(candidates));
})().catch(error=>{console.error(error);process.exitCode=1})
