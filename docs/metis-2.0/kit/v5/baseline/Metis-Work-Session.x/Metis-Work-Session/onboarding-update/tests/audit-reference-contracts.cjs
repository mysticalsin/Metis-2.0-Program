
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'overlay/src/renderer/src/components/OnboardingDemoScene.tsx'),'utf8');
const original=fs.readFileSync(path.join(root,'baseline/src/renderer/src/components/OnboardingDemoScene.tsx'),'utf8');
const inputs=JSON.parse(fs.readFileSync(path.join(__dirname,'reference-contract-input.json'),'utf8'));
const rows=[];
for(const [file,text]of Object.entries(inputs)){
 const re=/expect\(demo\)(\.not)?\.toMatch\((\/(?:\\.|[^\/\n])+\/[gimsuy]*)\)/g;let m;
 while((m=re.exec(text))){
  const lit=m[2],pos=lit.lastIndexOf('/');
  const pattern=new RegExp(lit.slice(1,pos),lit.slice(pos+1));
  const matches=body=>{pattern.lastIndex=0;const pass=pattern.test(body);return m[1]?!pass:pass};
  const before=matches(original),after=matches(source);
  rows.push({file,assertion:m[0],baseline_pass:before,improved_pass:after});
 }
}
const regressions=rows.filter(r=>r.baseline_pass&&!r.improved_pass);
fs.writeFileSync(path.join(root,'evidence/source-contract-audit.json'),JSON.stringify({rows,regressions},null,2)+'\n');
console.log(`${rows.length} literal source assertions checked; ${regressions.length} regressions`);
for(const row of regressions)console.log(row.file,row.assertion);
process.exitCode=regressions.length?1:0;
