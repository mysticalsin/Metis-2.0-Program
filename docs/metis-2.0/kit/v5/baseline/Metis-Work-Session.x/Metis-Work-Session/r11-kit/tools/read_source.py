#!/usr/bin/env python3
"""Read a bounded named FILE section from the user's exact source export; never execute it."""
from pathlib import Path
import argparse,hashlib,json,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--export',type=Path,required=True);p.add_argument('--path',required=True);p.add_argument('--start',type=int,default=1);p.add_argument('--lines',type=int,default=100);a=p.parse_args()
 ix=json.loads((ROOT/'source-review/SOURCE-INDEX.json').read_text());entries={x['path']:x for x in ix['sections']}
 if a.path not in entries:print('NOT_IN_EXPORT. Retrieve the exact source from the authorized checkout; do not invent a replacement.',file=sys.stderr);return 2
 if not 1<=a.lines<=300 or a.start<1:print('Use --start >=1 and --lines 1..300.',file=sys.stderr);return 2
 try:data=a.export.read_bytes()
 except OSError as e:print(str(e),file=sys.stderr);return 2
 if hashlib.sha256(data).hexdigest()!=ix['source_sha256']:print('Export digest mismatch. Regenerate the source index after an approved update.',file=sys.stderr);return 3
 entry=entries[a.path];lines=data.decode('utf-8').splitlines();lo=entry['content_start_line']+a.start-1;hi=min(entry['content_end_line'],lo+a.lines-1)
 for n in range(lo,hi+1):print(f'{n:06d} | {lines[n-1]}')
 return 0
if __name__=='__main__':raise SystemExit(main())
