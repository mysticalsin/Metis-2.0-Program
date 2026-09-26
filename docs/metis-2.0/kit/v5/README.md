# Métis 2.0 — v5: note-taking + keyboard assistant + JEV + Hindsight skill

**Full consolidated implementation package. The supplied Hindsight memory skill is
included and mapped into existing upgrade work; the installed app is not updated.**

Métis remains your note-taker and meeting copilot. Summon it from the keyboard to ask,
guide or act. The HeyClicky-inspired interaction, verified actions and JEV decisions
remain intact. Hindsight adds scoped continuity from approved sources, not a second
note-taking system or an automatic archive of recordings.

## Added in this edition

- The entire uploaded `hindsight-agent-memory` 1.0.0 skill: all 55 files, with the
  original ZIP and extracted reference bytes preserved, including clients and tests.
- One active `skills/metis-hindsight-memory/SKILL.md` entry with a mandatory Métis
  profile and progressive reading map. Do not register the nested generic skill again.
- Integration mapping to every original HMSTEP-01–16, the existing governed memory
  gateway, Entra/source authorization, Intelligence/Dust, JEV and note-taking controls.
- Twenty new HSAC application scenarios. The combined interaction matrix has 120
  cases, all NOT_RUN; original r11 base/expansion and release gates remain additional.
- Read-only inclusion/profile checks and their tests, with actual rerun evidence.

This edition changes skill packaging, integration contracts, acceptance and validation.
It does not change the ten existing behavior/JEV runtime modules or implement a new
runtime memory gateway. The uploaded reference clients are included, but are not
installed into the actual app by creating this archive.

## Start here

1. `keyboard-notes/PRODUCT-CORRECTION.md`: note-taking and keyboard-first product rules.
2. `delivery/IMPLEMENTATION-PROMPT.md`: the full updated job for the authorized coding host.
3. `skills/metis-hindsight-memory/SKILL.md`, then its `METIS-PROFILE.md`: active skill entry.
4. `memory/INTEGRATION.md`, `memory/HOST-BINDINGS.md`, `memory/HMSTEP-SKILL-CROSSWALK.json`:
   existing-service implementation mapping and remaining bindings.
5. `jev/JEV-INTEGRATION.md` and `jev/BACKLOG.json`: preserved JEV integration.
6. `IMPLEMENTATION-REPORT.md` and `memory/evidence/FINAL-STATUS.json`: actual evidence/limits.

Normal employees do not install coding agents, run a memory server, enter a Hindsight
key, or open a second memory console. The skill is for implementing Métis; the product
uses its own authenticated memory API and familiar interfaces.

## Full earlier package preserved

`baseline/Metis-Work-Session.zip` and `baseline/Metis-HeyClicky-Interaction-Upgrade.zip`
remain byte-identical. The original r11 MASTER, 66 root tasks, 55 base requirements,
112 base use cases, 12 golden flows, AGSTEP/OBU/HMSTEP expansions, 20 CXSTEP children,
10 JVSTEP children, and all note/keyboard requirements remain. Modified v4 handoff
files have their original copies under `memory/evidence/previous-v4/`.

The new original skill archive is `baseline/hindsight-agent-memory-skill-v1.0.0.zip`.
Do not extract old source snapshots over today's checkout. Do not run the old
fixed-16-file publisher after expanding the source scope.

## Offline checks

From the package root:

```sh
python3 tools/check_hindsight_package.py
python3 -m unittest discover -s memory/tests -p 'test_*.py' -v
```

For the original supplied skill's offline tests:

```sh
cd skills/metis-hindsight-memory/reference/hindsight-agent-memory
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/memory_client.test.mjs
python3 scripts/validate_package.py
```

From `behavior-core/`, `npm test` reruns the existing candidate. These commands require
only the already available Python/Node runtimes and do not install dependencies or call
Hindsight. Python transport tests and one existing JEV test bind local loopback fixtures.
Do not run the live smoke or local Compose without the separate required authorization.

The final ZIP was independently extracted and checked for packaging and preservation.
No actual app/native/service/tenant/retention/release gate becomes passed from these checks.
