#!/usr/bin/env python3
"""Read one scoped agent work item from the handoff. No application or network access."""
from pathlib import Path
import argparse,json
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--step',required=True,type=int,choices=range(1,19));a=p.parse_args()
 d=json.loads((ROOT/'plan/AGENT-EXPANSION.json').read_text(encoding='utf-8'));name=f'AGSTEP-{a.step:02d}';step=next(x for x in d['ordered_steps'] if x['id']==name);gates=[g for g in d['gates'] if g['id'] in step['gates']]
 cases=[c for c in d['cases'] if c['gate'] in step['gates']];obs=json.loads((ROOT/'clicky-study/OBSERVATIONS.json').read_text(encoding='utf-8'));wanted={i for g in gates for i in g['source_observations']}
 print(json.dumps({'scope':'PLANNED_IMPLEMENTATION_NOT_VERIFIED','step':step,'gates':gates,'cases':cases,'source_observations':[o for o in obs if o['id'] in wanted],'read_next':['spec/MASTER.md §0 and §32','existing repository instructions','the named parent TASK records and actual referenced code']},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
