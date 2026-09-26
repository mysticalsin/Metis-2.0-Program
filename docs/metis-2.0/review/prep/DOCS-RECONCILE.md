# P6 — Docs Reconcile: repo design/security/compliance docs vs the r11 + v6/v5 kits

**Scope read:** `metis-2.0/docs/design/*.md` (all 26 files, full read on the 8 named as primary:
METIS-PLATFORM-NORTH-STAR, METIS-CF-LLM-GATEWAY, METIS-2.0-JARVIS-COMMAND,
METIS-2.0-COMPUTER-CAPABILITY-MAP, METIS-2.0-CAP2-WAKE-ADAPTERS, MANTU-INTELLIGENCE, DESIGN.md,
OPERATOR.md); `docs/security/AUDIT-10.md`, `AUDIT-20.md`, `EMBEDDED-KEY-ROTATION.md`;
`docs/PROVIDER-ROUTING-POLICY.md`; `docs/NETWORK-EGRESS.md`; `docs/compliance/*` (all 8 files);
`docs/asktoto-architecture.md` (skimmed — currency banner + §A/B only, 174K total); `docs/plans/*`
(all 3); `docs/DESIGN.md` folded into design/. Compared against `spec/MASTER.md` (r11, rev 4.5,
5363 lines, §0–§35) by section/line, and against the v6/v5 kit lineage via
`plan-inputs/KIT-REQUIREMENTS.json` lane `K08-v6-v5-lineage` (already extracted; not re-derived here).

Evidence labels follow the program's convention: **OBSERVED** (read the file myself, this pass),
**DERIVED** (combining two OBSERVED facts), **ASSUMED**, **UNKNOWN**. Everything below is OBSERVED
or DERIVED unless marked otherwise.

---

## 1. Conflicts between repo docs and the kit — which should win, and why

### 1.1 Operator portal surface count — repo ships a thin seat/license console; the kit specs an 11-surface enterprise admin console

- **Repo (OBSERVED):** `docs/design/DESIGN.md` "Operator — Shoey OpenPanel bar" section (lines
  147–334) and `docs/design/OPERATOR.md` (the live, shipped design) define an 8-tab rail:
  `Overview · Realtime · Events · Sessions · Licenses · Notifications · Keys · Settings`. It is
  explicitly a single-operator (Tony, two personal emails) seat/license/heartbeat tracker cloned
  from WebsiteCloner's Shoey/OpenPanel visual chrome, with an explicit anti-slop rule against
  inventing pages ("Do not invent chrome that is not named here").
- **Kit (OBSERVED, MASTER.md §12.2, lines 1021–1042):** requires 11 named portal surfaces —
  Overview, **People**, **Devices**, **Usage and cost**, **Speech**, **Local models**,
  **Decisions**, **Native Apple**, **Installation and releases**, **Data health**,
  **Administration/audit** — plus §12.9's Skills / Knowledge health / Meetings-operations pages.
  None of People, Devices, Usage-and-cost drilldown, Speech, Local models, Decisions, Native Apple,
  Installation-and-releases, Data health, Skills, or Knowledge-health exist as named surfaces in the
  repo's Operator design (confirmed independently by lane K02: "6 of 11 spec-required Operator
  portal surfaces... have no matching page by name").
- **Which should win:** this is a genuine scope escalation, not a bug. The repo's OPERATOR.md is
  explicitly scoped `audience: Tony Walteur only. Two emails. Nobody else.` — a personal ops
  console for a handful of seats. The kit's §12 is written for a 10k-seat, multi-org, audited
  enterprise deployment (matches north star's own §6 "Scale — posture for 10k" framing). **Neither
  fully wins as-is.** Recommend: keep the shipped Shoey-chrome rail as the *visual system* (north
  star already says "if this file and a slice contract disagree on pixels, the slice wins") but
  treat §12.2's 11 surfaces as new tabs/panes to add inside that same chrome, not a rewrite. This
  needs an explicit owner decision (Tony) before TASK work starts, because it changes Operator's
  scope by roughly 3x.

### 1.2 Voice/orb/bar interaction model — three independent, non-identical designs exist

- **Repo, design A (OBSERVED, `DESIGN.md` + `BAR-PILL.md` + `ORB-SELECTION.md`):** the shipped Bar
  is an 880px glass toolbar; the "orb" is a 41×41 visible Jakub thinking-orb docked inside it, with
  a separate Settings → Appearance → "Bar rest" picker (Circle / Jarvis-particle / Full-bar).
- **Repo, design B (OBSERVED, `METIS-2.0-JARVIS-COMMAND.md`, approved by Tony 2026-09-20):** a
  *separate* command-session feature — top-center compact pill **or** a 48–52px right-edge sidecar
  tab that left-expands into a fixed-width drawer. Right Edge explicitly excludes Bar entirely.
- **Repo, design C (OBSERVED, `METIS-2.0-CAP2-WAKE-ADAPTERS.md`, dated 20 Sep 2026, code landed):**
  implements design B's wake path as a **top-center-only** `CommandListeningPill`, with 8 test files
  and 34 passing tests already in the repo. No right-edge sidecar code is referenced as landed here.
- **Kit (OBSERVED, MASTER.md §5.11, lines 456–500):** "ARMED is just the animated solving orb" —
  supersedes any static-idle prior decision, uses a 64px preset "solving" geometry, and explicitly
  flags its own internal contradiction against the production 41px Bar host spec in `DESIGN.md`
  (MASTER.md line 491, self-acknowledged). MASTER.md never mentions `JARVIS-COMMAND.md` or
  `CAP2-WAKE-ADAPTERS.md` by name or path anywhere in its 5363 lines (grep-confirmed) — it was
  authored without visibility into either repo doc, even though CAP2-WAKE-ADAPTERS predates or is
  contemporaneous with MASTER rev 4.5 (both dated ~20 Sep 2026).
- **Which should win:** MASTER §5.11 is the newest explicit owner decision at the *idle/ARMED
  visual* layer (one orb, 64px preset, animated-solving-only) and should win on that narrow
  question — it already says so ("supersedes revision 4.1/r6's static-idle decision"). But it
  cannot silently override JARVIS-COMMAND.md's *placement/sidecar* geometry (right-edge drawer,
  top-center pill, Bar exclusion on Right Edge) because MASTER never engaged with that design at
  all — this is an omission, not a reasoned supersession. TASK-030 (named in MASTER §5.11 itself)
  should be scoped to reconcile all three, not just pick MASTER's read of `DESIGN.md`. This is
  already flagged, independently, by lane K01 (§5.11-vs-§6.1 64px/41px self-contradiction) and by
  SRC-14 (MASTER §29) — treat as one reconciliation ticket, not three.

### 1.3 Mantu Intelligence — repo design is scoped 5x narrower than the kit's governed-knowledge contract

- **Repo (OBSERVED, `docs/design/MANTU-INTELLIGENCE.md`, dated 2026-09-06, status FRAME):** four
  outcomes — OneDrive brain auto-discovery at setup, meeting enrichment into that brain, a
  cross-meeting "Connections" UI, and purging empty dashboard shells. No mention of Dust write
  tools, provenance/evidence states, or an authority hierarchy.
- **Kit (OBSERVED, MASTER.md §17, lines 1536–1675, ~140 lines):** a governed-knowledge contract
  with a canonical record model (10 named provenance states: SOURCE-OBSERVED, EXTRACTED, INFERRED,
  HUMAN-VERIFIED, PINNED, EDITED, DISPUTED, SUPERSEDED, STALE, DELETED), an authority hierarchy
  (source record → canonical facts → wiki projections → retrieved context → response), and six named
  Dust MCP tools (`knowledge.search`, `.get`, `.changes`, `.explain`, `.propose_update`,
  `.commit_change`) with compare-and-swap write semantics.
- **Repo-verified gap (DERIVED from lane K02, independently corroborated by my own read of both
  docs):** zero `knowledge.*` MCP tools exist anywhere in the repo; `MANTU-INTELLIGENCE.md` does not
  describe or gesture at them. The repo doc and the kit section are not in tension on facts already
  stated — the repo doc is simply silent on the entire governed-knowledge/provenance/Dust-write
  layer the kit requires.
- **Which should win:** the kit's §17 is the fuller, later-dated requirement and should win as the
  target design. `MANTU-INTELLIGENCE.md` is not wrong, it is a subset (its four outcomes map to
  MASTER §17.3's "authorized knowledge content" and §17.5's wiki-exporter reuse) — it should be
  superseded by a new design doc that folds its four shipped-outcome items in as the *first
  increment* of §17's larger contract, rather than being read as the finished design for "Mantu
  Intelligence."

### 1.4 GDPR/compliance posture — compliance pack assumes single-user; kit assumes multi-seat enterprise deployment

- **Repo (OBSERVED, `docs/compliance/*`, all dated 2026-07-11, status "DRAFT — for DPO review, not
  yet adopted"):** every document is scoped to "a single-user, local-first... application used by
  one executive (Chief of Staff)" (README.md line 5) — the DPIA's project owner is Tony personally,
  the LIA scopes only Tony's own meetings, Article 30 lists Tony as sole user.
- **Kit (OBSERVED, MASTER.md §16.7, lines 1495–1535):** written for a deployment with "employee
  productivity scoring... employee-representative/works-council consultation... automatic[ally]
  join[ing] an eligible meeting" (i.e., Teams-integrated, multi-seat, other-employee-attended
  meetings) — matching §15's Teams personal-app/automatic-attendance requirements.
- **Which should win:** neither — they describe two different deployment shapes that the program is
  actually pursuing simultaneously (Tony's personal use today, Operator-fleet multi-seat + Teams
  participation as an m9/m10 milestone target). The compliance pack needs a second track added
  (not a rewrite of the existing one, which stays valid for Tony's own personal use) covering
  multi-seat/Teams-attendance processing once Teams integration (TASK-046..052, currently
  zero-code per lane K03) lands. Flag this as an open legal/DPO item for the goal owner, not an
  engineering task — MASTER.md itself says the same ("a human privacy owner signs off the
  deployment decision").

### 1.5 Cloudflare no-content-retention contract — repo docs don't implement or mention it

- **Repo (OBSERVED):** `NETWORK-EGRESS.md` documents *which hosts* Métis can reach and an
  allowlist enforcement mechanism (`egressAllowlist`, `egress-guard.ts`) — a destination-control
  document. `AUDIT-10.md`/`AUDIT-20.md` (dated 2026-08-31) are general application-security control
  audits (rate limiting, secrets, auth, XSS, etc.) and do not mention AI Gateway payload logging,
  `cf-aig-collect-log` headers, or a content-retention readiness state machine anywhere.
- **Kit (OBSERVED, MASTER.md §16.6, lines 1462–1495, ~90 lines):** a detailed, load-bearing
  contract requiring per-route readiness states (`UNREVIEWED`/`CONFIGURED`/`VERIFIED`/`BLOCKED`),
  three specific request headers (`cf-aig-collect-log: false`, `cf-aig-collect-log-payload: false`,
  `cf-aig-skip-cache: true`), and drift detection against a configuration baseline.
- **Cross-check (DERIVED, from lane K03's own repo grep):** lane K03 already found
  `operator/src/use.ts:232` sends only 2 of the 3 required headers (missing
  `cf-aig-collect-log:false`), which — per MASTER §16.6.5 — directly undercuts the exact
  user-facing privacy sentence the kit specifies ("configured not to persist audio or transcript
  content in Cloudflare logs, caches or application storage"). This is a live, code-level gap, not
  just a documentation one.
- **Which should win:** the kit's §16.6 is net-new and should be adopted in full — nothing in the
  repo's existing egress/audit docs contradicts it, they simply predate it (both are Aug/Sep-dated,
  before this AI-Gateway-specific contract existed in any kit revision the repo docs could have
  seen). Recommend a new `docs/security/AI-GATEWAY-NO-RETENTION.md` doc once the header gap is
  closed and the readiness-state machine exists, rather than folding 90 dense lines into
  `NETWORK-EGRESS.md`.

### 1.6 Provider routing — compatible but the kit's CLI-first framing is more prescriptive than the code-level policy doc

- **Repo (OBSERVED, `PROVIDER-ROUTING-POLICY.md`):** three routing modes (local/api/auto) with an
  explicit precedence list; CLI is one branch under `providerPriority === 'cli'`.
- **Kit (OBSERVED, north star §4.3, and R11 "CLI-first Ask when a live CLI session exists — Open"):**
  frames CLI-first as the *default* first-choice path whenever a live session exists, ahead of
  vault-funded providers, and marks it an open board item (R11), not yet fully implemented ("last-
  clicked wins" heuristic still to land per R11's own status).
- **Which should win:** no real conflict — `PROVIDER-ROUTING-POLICY.md` is the mechanism doc and the
  kit is the product-level policy goal it should be driven toward; R11's own status line ("Open —
  promote live CLI ahead of vault; last-clicked wins") already says the code doc is pre-R11-complete.
  No action needed beyond keeping the routing-policy doc's "Source of truth in code" pointers
  current as R11 lands.

---

## 2. Kit items that repo docs claim are already implemented (verify, don't re-build)

These are items where a repo design doc's prose reads as a completed/shipped feature that overlaps
a kit requirement — each needs a runtime/code verification pass (owned by the code-critic /
runtime-evidence lanes, not this doc) before being marked done in planning.

| Kit requirement | Repo doc's claim | What to verify |
|---|---|---|
| §16.6 no-content-retention headers (partial) | `AUDIT-10`/`AUDIT-20` "Present" scores don't cover this; N/A to check here | Confirm `operator/src/use.ts` header set against the 3-header requirement (lane K03 already flags 1 missing) |
| §12.9 "Notifications" showing skill diffs / CRM fail / pending seats | `DESIGN.md` Operator rail names `Notifications` with exactly these row kinds | Confirm the page exists and is wired to real D1, not just specified in DESIGN.md |
| §5.11 ARMED orb, 41px vs 64px | `DESIGN.md`/`BAR-PILL.md` state 41×41 is the *production* Bar host size, already shipped | K01 already flags the §6.1 code sketch hardcodes `size={64}` with no reconciliation — verify which size is actually in the running app today |
| Wake-word "Hey Métis" / command session safety boundary (§4 command-session contract; JARVIS-COMMAND acceptance criteria) | `METIS-2.0-CAP2-WAKE-ADAPTERS.md` states 8 test files / 34 tests pass, deterministic-parser-only, Jev disabled by default, meeting-audio cannot trigger commands | Re-run (do NOT execute per hard rules — flag for the code lane instead) the cited test files to confirm still-green at HEAD; verify `jevEnabled` still defaults false |
| Egress allowlist enforcement (`egress-guard.ts`) | `NETWORK-EGRESS.md` cites `egress-guard.test.ts`, `egress-policy.test.ts`, `bank-grade-hardening.contract.test.ts` as proof | Confirm these three tests exist and pass at current HEAD (code lane, not this doc) |
| Embedded-key rotation | `EMBEDDED-KEY-ROTATION.md` gives a one-command rotation (`npm run rotate:embedded-keys`) | Confirm the script exists and the residual (asar-recoverable `METIS_PROXY_KEY`, Cahê key) is still the accepted posture for r11/enterprise release gates (§20 Windows signing / release-gate section) |
| Operator Access-gated admin, HMAC ingest | North star §5.1/§5.4, `OPERATOR.md` "Security (unchanged)" | Kit §12.1 asks for a full synthetic E2E trace through auth→ingest→storage→export; repo docs assert the pieces exist but not that the full chain was traced end-to-end recently |
| DPIA / Article 30 / recording-policy pack | `docs/compliance/*` — substantive (34–202 lines each), not stubs | Still "DRAFT — not yet adopted," several fields explicitly say "verify with Legal" / "to be filled in by DPO's office" — treat as a real draft to hand to the goal owner, not as closed compliance work |

---

## 3. Prior audit findings still open

Cross-referencing `AUDIT-10.md` / `AUDIT-20.md` (2026-08-31, product-security) against MASTER §16 and
the newer runtime evidence in `BUG-ROOT-CAUSES.json` / `CODE-FINDINGS.json` (owned by other lanes —
citing only what bears directly on the docs read for this task):

- **AUDIT-10/20's own residuals, self-declared still-open (not closed by later docs I read):**
  - Installer-embedded `METIS_PROXY_KEY` and Cahê Kimi key remain asar-recoverable "by design"
    (documented residual, not a fail) — still true per `EMBEDDED-KEY-ROTATION.md`, no repo doc
    proposes removing the embed model entirely.
  - Streamdown's HTML sanitizer remains "their stack, not ours" — no repo doc I read re-audits this.
  - ffmpeg parser bugs on a *valid* malicious media file remain an accepted residual (no AV shipped).
  - License-server rate limiter and Worker cache limiter are explicitly **single-instance /
    colo-local**, not globally durable — a real gap if Fly or the Worker ever scales horizontally.
    Kit §12 (Operator scale posture) and north star §6 (scale for 10k) do not address this
    specific single-instance-limiter residual anywhere I found.
- **Newly surfaced by the kit, not covered by AUDIT-10/20 at all (i.e., "open" because it was never
  in scope for that audit):**
  - The entire §16.6 Cloudflare no-content-retention contract (see §1.5 above) — AUDIT-10/20 predate
    it and never test for AI-Gateway payload logging/caching.
  - §16.7 GDPR/works-council/DPIA-for-Teams-deployment requirements — outside AUDIT-10/20's declared
    scope (they explicitly scope to "desktop main + renderer IPC, local files, license-server HTTP,
    cloudflare-proxy Worker," not privacy/GDPR).
  - §12.1's "authorized synthetic E2E trace, not a portal screenshot using fixtures" standard — no
    repo doc I read documents such a trace having been run.
- **AUDIT-10/20 items now Present that a repo reader could mistakenly think are still open:** none
  found — both audits' "Post-fix score" tables are internally consistent with their own Phase 2/2b/3/4
  remediation tables, and I did not find a repo doc that contradicts a "Present" verdict.

---

## 4. Docs that should be retired or updated for 2.0

- **`docs/asktoto-architecture.md` (174K, dated re-verified 2026-07-10) — update, do not retire
  wholesale.** Its own currency banner already flags sections L/M as "forward-looking... not a
  description of shipped code" and tells the reader to re-check line numbers. It predates the
  overlay Hide/Island/Bar redesign, the Operator/HMAC/vault-last4 platform, the Jarvis command
  session, and the entire r11 kit. It is still useful as the founding product-narrative/UX doc
  (Sections A–D read as still-broadly-accurate for the core Ask/Listen/screen-aware loop), but a
  2.0 pass should either (a) add a second, prominent currency banner pointing at
  `METIS-PLATFORM-NORTH-STAR.md` as the authoritative platform doc, or (b) split it: retire Sections
  K/L/M (roadmap/artifacts/taste — superseded by the kit and by shipped design docs) and keep A–J as
  a "how it works today" reference, re-verified against 2026-09 HEAD rather than 2026-07-10.
- **`docs/plans/2026-07-10-packaged-local-ai-implementation-plan.md` — already self-marked
  superseded** ("Superseded 2026-07-13 — do not execute"). No action needed beyond leaving the banner
  in place; do not delete (it documents a real rejected direction, useful lineage for TASK-owners
  touching local-model packaging).
- **`docs/plans/2026-07-11-meeting-intelligence-100x-plan.md` — update status banner, partial overlap
  with `MANTU-INTELLIGENCE.md`.** Self-marked "PARTIALLY IMPLEMENTED — Phases 0–4 in source... Phases
  6–8 remain roadmap." Its later phases (publish/Dust-readable corpus, cross-referencing) are the
  same territory `MANTU-INTELLIGENCE.md` (Sept 6) and MASTER §17 now own more completely. Recommend
  folding its still-open Phases 6–8 into whatever supersedes `MANTU-INTELLIGENCE.md` per §1.3 above,
  then marking this plan doc historical/closed rather than leaving two open roadmaps for the same
  feature area.
- **`docs/plans/time-saved-and-summaries.md` — no conflict found; keep as-is.** Scoped narrowly
  (Time Saved tile + two summary formats), already cross-referenced by `TIME-SAVED.md`; nothing in
  MASTER.md contradicts it directly.
- **`docs/design/MANTU-INTELLIGENCE.md` — supersede/expand, do not retire.** See §1.3: keep its four
  outcomes as the shipped-increment description, but it should not be read as a complete design for
  "Mantu Intelligence" once §17's governed-knowledge/Dust-MCP-write layer is scoped — a v2 of this
  doc (or a new `docs/design/MANTU-INTELLIGENCE-GOVERNANCE.md`) is needed before TASK-035..041 land.
- **`docs/security/AUDIT-10.md` / `AUDIT-20.md` — keep, but scope-note them.** They are complete and
  internally consistent for what they audit (general app security, 2026-08-31). Add a one-line
  pointer from each to a future AI-Gateway-privacy-specific audit doc (per §1.5) so a reader doesn't
  mistake "8/10 Present" / "15/15 Present" for coverage of the no-content-retention contract, which
  they explicitly do not test.
- **`docs/compliance/*` — keep all 8, unchanged in content, but add a second deployment-scope
  section per §1.4** once Teams/multi-seat work is scheduled; do not let the existing personal-use
  DPIA silently "cover" the future multi-seat/Teams-attendance processing.
- **No repo doc should be deleted outright** — every doc read in this pass is either still accurate,
  self-marked superseded/draft already, or a subset of a larger kit requirement rather than
  something contradicted by it.

---

## Notes on method / what this pass did not do

- Did not re-run any repo tests or execute repo code (hard rule — test processes have twice resolved
  Tony's real OneDrive folder and quarantined the brain index).
- Did not re-derive the SRC-01..24 code-level findings, the runtime evidence (orphaned sidecars,
  ~3.1GB phys_footprint, onFatal relaunch), or the BUG-ROOT-CAUSES verdicts — those are owned by
  other lanes (code-critic, bug-root-cause) and are only cited here where a repo *doc* claim
  intersects them.
- Skimmed rather than fully read `docs/asktoto-architecture.md` (174K) per the task's own
  instruction; its currency banner and Sections A–D were read in full, B.2–M were not line-audited
  against the kit in this pass.
- Did not open `docs/design/BAR-PILL.md`, `ORB-SELECTION.md`, `THINKING-ORB.md`, `QUALITY.md`,
  `IDENTITY-CARD.md`, `ONBOARDING-*.md`, `MODE-SKILLS.md`, `BRAIN-CONNECTORS.md`, `CLICKUP-PUSH.md`,
  `IMPORT-MEETINGS.md`, `INTELLIGENCE-UPDATE.md`, `TIME-SAVED.md`, `OPERATOR-LICENSES-ROI.md`,
  `DESIGN-SPEC.md`, or `2026-07-10-packaged-local-ai-design.md` in full — these were not on the
  task's named list and were only referenced where `DESIGN.md`/north star pointed at them. If a
  later lane needs those cross-checked against the kit, that is a follow-up task, not covered here.
