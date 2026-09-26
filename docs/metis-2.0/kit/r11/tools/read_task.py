#!/usr/bin/env python3
"""Read one numbered task or one master section. No network, dependencies or file writes."""
from pathlib import Path
import argparse, re
ROOT=Path(__file__).resolve().parents[1]
def main():
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group(required=True)
    g.add_argument('--task',type=int);g.add_argument('--section',type=int)
    a=p.parse_args()
    if a.task is not None:
        if not 1<=a.task<=66:p.error('Task must be 1..66.')
        print((ROOT/f'plan/tasks/TASK-{a.task:03d}.md').read_text(encoding='utf-8'));return
    if not 0<=a.section<=35:p.error('Section must be 0..35.')
    s=(ROOT/'spec/MASTER.md').read_text(encoding='utf-8')
    m=re.search(rf'(?m)^## {a.section}\. ',s)
    if not m:raise SystemExit('Section not found.')
    nxt=re.search(r'(?m)^## \d+\. ',s[m.end():]);end=m.end()+nxt.start() if nxt else len(s)
    print(s[m.start():end])
if __name__=='__main__':main()
