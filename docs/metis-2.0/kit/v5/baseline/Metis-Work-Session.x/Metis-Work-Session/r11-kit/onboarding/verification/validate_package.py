#!/usr/bin/env python3
"""Read-only amendment integrity checks. This is not product, native, or human-content certification."""
from pathlib import Path,PurePosixPath
import argparse,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(root,hashes=True):
 checks=[]
 def ck(n,v):checks.append({'check':n,'passed':bool(v)})
 manifest=json.loads((root/'media/tony-walteur.manifest.json').read_text());html=(root/'preview/index.html').read_text();js=(root/'preview/app.js').read_text();css=(root/'preview/app.css').read_text();policy=(root/'integration/onboarding-policy.cjs').read_text();contract=(root/'ONBOARDING-INTEGRATION.md').read_text()
 ck('Only Tony Walteur is the configured presenter',manifest['presenter']=='Tony Walteur' and manifest['allowedNamedHumans']==['Tony Walteur'])
 ck('Unprovided recording remains empty and unapproved',manifest['status']=='NOT_PROVIDED' and manifest['video'] is None and manifest['poster'] is None and not manifest['captions'] and manifest['contentReview']['status']=='PENDING')
 ck('No old, remote or autoplay media fallback',manifest['runtime']['externalFallback'] is None and manifest['runtime']['autoplay'] is False and manifest['runtime']['completionControlledByVideo'] is False and '<video'not in html.lower() and '<audio'not in html.lower())
 ck('Source-aligned route retains Appearance and Ready',"['hero','problem','reveal','appearance','setup','personalize','ready']" in js and "['hero','problem','reveal','appearance','setup','personalize','ready']" in policy)
 ck('Existing desktop and older native topology explicitly distinguished','older five-act' in contract and 'actual checkout' in contract and 'not a substitute for the component' in contract)
 ck('Existing real product demo is preserved in the integration contract','real Bar/Copilot/Answer/QuickActions components' in contract and 'Do not replace Reveal' in contract)
 ck('No recording masquerades as a supplied asset',not any(p.suffix.lower() in {'.mp4','.mov','.m4a','.mp3','.wav','.webm','.vtt'} for p in root.rglob('*') if p.is_file()))
 ck('Readable source matches embedded preview',js in html and css in html and (root/'preview/vendor/solving-engine.js').read_text() in html)
 ck('No external API/capture/persistence in interactive reference',not any(x in js for x in ['fetch(', 'getUserMedia','localStorage','sessionStorage','new WebSocket','sendBeacon','XMLHttpRequest']))
 ck('CSP explicitly blocks connections and media',"connect-src 'none'"in html and "media-src 'none'"in html and "object-src 'none'"in html)
 ck('No borrowed marketing or person names in active preview copy',not any(x.lower()in js.lower()for x in ['HeyClicky','Vibe Island','Farza','Devon','Jakub','lady-planet']))
 ck('Filming script is not labelled as a final transcript','not a transcript of an existing video' in (root/'media/TONY-WALTEUR-FILMING-GUIDE.md').read_text())
 ck('No font files or symlinks redistributed',not any(p.is_symlink()or p.suffix.lower()in ['.ttf','.otf','.woff','.woff2','.eot']for p in root.rglob('*')))
 ck('Third-party license and provenance retained outside visible copy',(root/'preview/vendor/THINKING-ORBS-LICENSE.txt').is_file() and (root/'preview/vendor/PROVENANCE.json').is_file())
 for name in ['policy-results','browser-results']:
  x=json.loads((root/f'verification/{name}.json').read_text());ck(name+' reports actual reference checks passing',x['passed'] and all(i['passed'] for i in x['checks']))
 if hashes:
  m=json.loads((root/'verification/CHECKSUMS.json').read_text());actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and p.name!='CHECKSUMS.json' and '__pycache__'not in p.parts};bad=[]
  for n,w in m['files'].items():
   pp=PurePosixPath(n);p=root/n
   if pp.is_absolute()or'..'in pp.parts or p.is_symlink()or not p.is_file()or digest(p)!=w['sha256']:bad.append(n)
  ck('Complete amendment checksum inventory matches',not bad and actual==set(m['files']))
 return {'scope':'AMENDMENT_STATIC_INTEGRITY_NOT_PRODUCT','checks':checks,'passed':all(x['passed'] for x in checks)}
def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--skip-hashes',action='store_true');a=p.parse_args();r=validate(a.root.resolve(),not a.skip_hashes);print(json.dumps(r,indent=2));return 0 if r['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
