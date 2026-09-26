# Kit text reference (`docs/metis-2.0/kit/`)

Text-only working copies of the three input kits, for Codex/Cursor agents that cannot read outside this repo checkout. Provenance and per-file hashes are in `MANIFEST.json`.

## Provenance

| Label | Source (read-only, outside this repo) |
|---|---|
| `kit/r11/` | `metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11/` |
| `kit/v6/` | `metis-v2-inputs/v6/Metis-Upgrade-v6-BRAG-Hindsight/` |
| `kit/v5/` | `metis-v2-inputs/v5/Metis-Behavior-Upgrade-v5-Hindsight/` |

## Inclusion rule

Extensions `.md .json .txt .py .mjs .cjs .ts .html .yml`, file size ≤ 1,572,864 bytes (1.5 MB), copied verbatim (except the redactions listed in `../review/REDACTIONS.md`) with relative structure preserved under each kit's own root (`Metis-2.0-Upgrade-Kit-r11/`, `Metis-Upgrade-v6-BRAG-Hindsight/`, `Metis-Behavior-Upgrade-v5-Hindsight/`, including the `baseline/*.x` text trees inside v5).

## Excluded, and why

| Reason | Files |
|---|---:|
| extension (none) not in whitelist | 2 |
| extension .command not in whitelist | 1 |
| extension .css not in whitelist | 11 |
| extension .csv not in whitelist | 2 |
| extension .dot not in whitelist | 2 |
| extension .example not in whitelist | 2 |
| extension .gif not in whitelist | 2 |
| extension .jpeg not in whitelist | 2 |
| extension .js not in whitelist | 27 |
| extension .jsonl not in whitelist | 2 |
| extension .log not in whitelist | 29 |
| extension .mmd not in whitelist | 8 |
| extension .mp4 not in whitelist | 2 |
| extension .patch not in whitelist | 3 |
| extension .pdf not in whitelist | 12 |
| extension .png not in whitelist | 118 |
| extension .svg not in whitelist | 2 |
| extension .tap not in whitelist | 20 |
| extension .tsx not in whitelist | 7 |
| extension .yaml not in whitelist | 2 |
| extension .zip not in whitelist | 4 |
| named-exclusion (metis-1.9.5-export.txt) | 2 |

Two files were excluded by explicit name regardless of location — `references/source/metis-1.9.5-export.txt` (an 11.1 MB full-app export embedded in both the r11 kit and, a second time, inside `v5/baseline/Metis-Work-Session.x/.../r11-kit/`) — because it is both far over the size limit and a duplicate of source already read via the reference checkout at `metis-2.0/`. All other exclusions are mechanical: the extension is not on the whitelist (this is how every `.png .jpg .gif .svg .mp4 .pdf .zip .js .tsx .css` asset, and the v6 `baseline/*.zip`, are kept out) or the file exceeded 1.5 MB.

## Total

977 files, 11,094,177 bytes (10.58 MB) after redaction.

