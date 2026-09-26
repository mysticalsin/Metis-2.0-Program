#!/usr/bin/env python3
"""Read one Hindsight slice without loading the entire delivery contract."""
from pathlib import Path
import argparse
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--step',type=int,required=True);a=p.parse_args()
if not 1<=a.step<=16:p.error('Step must be 1..16.')
print((Path(__file__).resolve().parents[1]/f'memory/steps/HMSTEP-{a.step:02d}.md').read_text())
