# Settings 2.0: four destinations, search, inventory and migration (M2-0101)

Designer: Opus. Base: public `7dab8e8964e9b2814cd1477a9a7b724628a04d6a` (= `origin/m2/integration`).
Status: design (evidence level DESIGNED). Implemented by M2-0117 (slices .1 migration, .2 UI, .3 local-model
states); M2-0062 and M2-0071 land the settings authority and the Settings.tsx split it builds on.
Line anchors are at the base commit. Evidence labels: OBSERVED, DERIVED, ASSUMED, UNKNOWN.

Kit references: TASK-008, M2-SET-01, M2-SET-02, COV-15. Kit sections read: MASTER §5.6–5.9 (simplified
Settings), §8.13 (UC-097–UC-100), §9.6 and §9.10 (speech routing and fallbacks), §14.7–14.8 (optional local
models), FLOW-07, EXP-01 and EXP-05 (plan/EXPERIENCE-REQUIREMENTS.json), SRC-14/15/22, AGX-05, HM-13.

## 0. The design in one paragraph

Métis today spreads 115 settings keys over nine tabs, searches at tab granularity, hides explanations in
tooltips, and cannot tell a user why a switch is locked or that a save failed. Settings 2.0 keeps every
stored key and, with one versioned exception (`cloudSttProvider`, §5), its meaning, and puts every control
in exactly one of four everyday destinations (General; Voice & meetings; Knowledge & skills; Privacy &
account) or behind a labelled disclosure, with one Advanced drawer and a search that lands on the control
itself. The machine-readable inventory (`inventory.json`, 139 entries: all 115 schema keys and their 150
leaf paths, the new `settingsVersion`, and the secrets, OS permissions and native Mac keys the Settings UI
shows) classifies each entry KEEP, MERGE, ADVANCED, OPERATOR-ONLY, DEPRECATED or PLATFORM-SPECIFIC and
binds it to one control or to none.
Three rules carry most of the weight: a privacy route (where speech is processed, what is captured, what is
shared) never changes by itself, not through a default, a failure, an installed pack or an upgrade; every
control shows its effective value and who set it; and the UI only ever shows what the main process
confirmed. An HTML mock renders straight from the inventory, and its 17 states were captured in light and
dark, at 1x and 2x, with and without reduced motion, and passed automated WCAG AA contrast, clipping and
motion checks. The owner has since ruled that Métis is the installed Electron app on macOS and Windows, so
those captures are a superseded HTML mock, kept as design reference and not app evidence; every state is to
be captured again from the Electron renderer in CI (§10).

## 1. Deliverables

| Path (under `docs/metis-2.0/`) | What it is |
|---|---|
| `design/settings/SETTINGS-2.0.md` | This design |
| `design/settings/inventory.json` | The inventory: destinations, 99 controls, 139 classified keys, legacy and deep-link migration tables, policy sources |
| `design/settings/check-inventory.py` | Static completeness and consistency check of the inventory against `BaseSettingsSchema` at the base commit (no repository code runs) |
| `design/settings/prototype/` | Superseded HTML mock (`index.html`, `prototype.css`, `prototype.js`, `states.js`), in-page audit (`audit.js`) and the record of its capture harness (`capture.js`); design reference only, never opened or run on the owner's machine (OD-12, §10) |
| `evidence/M2-0101/design/` | 136 captures of the superseded HTML mock (68 image files), `manifest.json`, `audit.json`; `inventory-check.txt` |

The ticket's scope also names `src/renderer/src/features/settings/inventory.json` and
`scripts/settings/check-inventory.mjs` in the public repository. This session had no public worktree or
branch assigned, so both land with M2-0117.1 (§12): the inventory moves with its private references
replaced by ticket ids, and the Node check replaces `check-inventory.py`, enforcing its rules against the
live schema.

## 2. What exists today

All OBSERVED at the base commit unless labelled.

**Navigation and search.**
- Nine tabs: Modes & Display, AI, Speech, Calendar, Meetings, Brain, Privacy, Identity, About
  (`src/renderer/src/components/Settings.tsx:6136-6254`). The tab ids (`personalize`, `ai`, `audio`,
  `calendar`, `meetings`, `intelligence`, `privacy`, `profile`, `about`) differ from their labels.
- Search matches a hand-maintained keyword list per tab and jumps to the tab, not to a control
  (`Settings.tsx:6262-6271`). A comment asks maintainers to copy every section title into the keywords
  (`Settings.tsx:6131-6135`); nothing enforces it.
- 48 `<Section>`/`<ExpandableSection>` cards across the tabs (JSX usages in `Settings.tsx`; the two other
  matches are the comments at `Settings.tsx:6128, 6133`), almost all visible without disclosure; the file is
  9,377 lines.
- Deep links: `openSettings(tab, notice)` accepts `personalize`, `calendar` and `ai`
  (`src/renderer/src/App.tsx:1326`); the post-onboarding route passes `?tab=ai`
  (`src/renderer/src/lib/onboarding-launch.ts:3-10`).
- Settings is the only place the mode can be changed; the bar only shows it
  (`src/renderer/src/components/ModePicker.tsx:29-32`).

**Explanations and locks.**
- A toggle's explanation lives in a hover tooltip (`Settings.tsx:678`), which MASTER §5.9 rules out for
  necessary explanations.
- The renderer learns only which keys are locked: `managedKeys` is `getLockedKeys()`
  (`src/main/index.ts:2042`). An organization default that is not locked looks exactly like the user's own
  choice. The nested managed `azure` block is invisible to `managedKeys` (`Settings.tsx:8542-8556`).
- "Managed by your organization" appears for any disabled toggle, whatever the reason (`Settings.tsx:682`),
  and no control says who manages it or why.

**Saving.**
- Settings persist sparsely: only user overrides are written, and every read layers
  DEFAULT < managed < user (`src/main/store.ts:638-640, 780-808`). DERIVED: changing a schema default moves
  every profile that never wrote that key, silently. The codebase has met this before
  (`src/shared/ipc.ts:1267-1272`, the `localLlm.useFor` comment).
- The renderer never shows an unconfirmed value: `patch` renders the main process's reply
  (`src/renderer/src/state.ts:607-610`). But a rejected save is an unhandled promise in most call sites
  (30 `onChange={(v) => patch(...)}` handlers in `Settings.tsx`), so the user sees nothing. Three writes
  show a saving and a failed state: overlay placement (`Settings.tsx:6363-6379, 6605-6614`), Replay
  onboarding (`Settings.tsx:6346-6362, 7502-7519`) and the legacy Operator secret
  (`Settings.tsx:6326-6337, 7156-7164`).
- Replay onboarding and Log out use `window.confirm` (`Settings.tsx:6347, 7524`), which FF-06 retires.
- The renderer write boundary is three unlinked strip arrays (`src/main/index.ts:4845-4885`); M2-0062
  replaces them with one constant.

**Speech and local models.**
- Cloud speech runs only under a managed cloud-only profile; for everyone else the stored cloud provider is
  ignored and local `asrEngine` transcribes (`src/shared/cloud-stt-provider.ts:46-54`). MASTER §9.6 names this
  exact function as a migration target.
- A fresh profile picks Whisper or Parakeet from physical memory; completed sparse profiles keep Parakeet
  (`src/main/store.ts:691-703, 815-825`).
- Turning on Métis Local starts a model download at once (`src/main/index.ts:5033-5037`), and launch
  re-provisions an enabled model (`src/main/index.ts:8884`). A disabled model is never fetched
  (`src/main/local-model-provisioning.ts:8-9`), which contradicts the schema comment that weights "still
  download in the background whenever the app opens" (`src/shared/ipc.ts:1259-1263`).

**Dead or inert keys.** `autoSaveTranscripts` has no reader outside the self-test
(`src/main/selftest.ts:77`) while Settings says meetings are always saved (`Settings.tsx:7293`);
`sendAskText` has no effect (`src/shared/operator.ts:91-97` always returns false); the legacy license server's
UI and enforcement are compiled off (`Settings.tsx:201`, `src/renderer/src/App.tsx:311`,
`src/main/license.ts:5-14`).

**Native Mac.** The native Settings keeps its own UserDefaults keys `metis.mode`, `metis.language` and
`metis.consent` (`native-app/App/Settings/SettingsView.swift:9-11`). Language and consent have no reader
outside the pickers. Its copy says "nothing is uploaded" (`SettingsView.swift:40`), which stops being true
under the Cloudflare speech default.

## 3. Invariants

**INV-1 (stable keys).** Every control reads and writes existing keys, and every key keeps its existing
meaning except one: `cloudSttProvider`, whose meaning widens at settings version 2 from "the cloud provider
of a managed cloud-only profile" to "the speech route of every profile" (§5, §9.1). No key is renamed. The
design adds one key, `settingsVersion` (§9), inventoried with `planned_by: "M2-0117.1"`, and new
capabilities add keys only in their owning tickets (§4, "new"). The inventory binds each key to exactly one
control or to none, and each control lists exactly the keys it writes. `check-inventory.py` enforces both
directions: a key's control lists that key, and every key a control lists is bound to that control.

**INV-2 (no silent privacy change).** Where speech is processed, what is captured and what is shared change
only through an explicit user action or an organization policy the user can see. A default change, an
upgrade, a failure, an installed pack or capable hardware never changes them (MASTER §9.6, §9.10, §14.7;
M2-SET-02). Consequential changes (capture, sharing, policy, model installation, encryption, retention) ask
for confirmation in the app, never through `window.confirm`.

**INV-3 (effective value and source).** Every control shows the value in force and, when it is not the
user's own choice, who set it and why (§6). A lock is a value with an owner, not a greyed-out switch.

**INV-4 (confirmed values only).** A control shows only a value the main process confirmed. A failed save
keeps the confirmed value on screen and says so, with a retry (UC-099).

**INV-5 (never buried).** Stop all capture, recording consent, screen access, redaction, encryption and
retention are never behind a disclosure; no control in Privacy & account is behind one. An optional feature
that can keep a microphone open (Desk tap control with Always armed) may sit behind a disclosure only while
it is off; while it is on, it is listed in the Capture group next to Stop all capture.

**INV-6 (search shows only what the person may see).** Search and deep links reach only controls that are
visible to this principal on this platform. A deep link to a hidden or disabled control opens its
destination with a neutral note; it never reveals the control or its configuration.

**INV-7 (one registry, every surface).** Electron, native Mac and the Teams panel render the same registry
semantics (MASTER §5.7). The native app stops keeping its own copies of shared keys (§9.3).

## 4. Information architecture

Four destinations in a sidebar, then a divider and the Advanced drawer (a labelled disclosure that expands
into its group links), then the organization chip when a policy applies. Search sits in the header
(Cmd/Ctrl+F). Each destination opens with one readiness summary card, then its groups. Within a group,
rarely used controls sit under a "More options" disclosure; six groups are disclosures themselves (Names
and vocabulary, Optional local speech, Desk tap control, Source connections, Indexing and graph,
Time-saved estimate). While anything is being captured, the header shows a recording pill with Stop all
capture on every destination.

Counts (DERIVED from the inventory): 48 everyday controls (General 12, Voice & meetings 11, Knowledge &
skills 6, Privacy & account 19), 20 behind disclosures inside destinations, 24 in the Advanced drawer, and 7
new controls owned by other tickets. Today: nine tabs and 48 cards, nearly all always open.

Layout: sidebar 216 px and a scrolling content column at the 880 × 800 minimum Settings surface
(`src/shared/settings-bounds.ts:6`). Below 600 px (narrow windows, the Teams side panel) the sidebar becomes
the first screen and a destination opens full width with a Back control (state S15).

Legend: _disclosure_ = behind a disclosure; _confirm_ = asks before applying; _next session_ = applies to
the next meeting or command session; "new: M2-xxxx" = control delivered by that ticket.

#### General

| Group | Control | Keys (class) |
|---|---|---|
| Appearance | Where Métis lives | `overlayLayout` (KEEP), `autoHideOverlay` (MERGE) |
|  | Position | `overlayPlacement` (KEEP) |
|  | Bar at rest | `overlayOrbStyle` (KEEP) |
|  | Background transparency | `overlayOpacity` (KEEP) |
|  | Reset position | `overlayRightEdgeYByDisplay` (KEEP) |
|  | Animated ring on quick actions _(disclosure)_ | `quickActionsRainbow` (ADVANCED) |
| Language | Answer language | `outputLanguage` (KEEP) |
|  | Summary language _(disclosure)_ | `summaryLanguage` (ADVANCED) |
| Keyboard shortcuts | Keyboard shortcuts | `shortcuts` (KEEP) |
| Sounds and motion | Sounds | `uiSounds` (MERGE), `soundCues` (MERGE) |
|  | Motion | readout: follows the system's reduced motion setting |
| Startup | Open Métis when you sign in | `launchAtLogin` (KEEP), `loginItem` (KEEP) |
|  | Replay setup _(confirm)_ | `onboardingDone` (KEEP) |
|  | Quit Métis | action |

#### Voice & meetings

| Group | Control | Keys (class) |
|---|---|---|
| Speech | Speech processing _(confirm; next session)_ | `cloudSttProvider` (KEEP) |
|  | Recent speech issues | `asrLastFallbackAt`, `asrWebgpuFallbackAt`, `asrImportTierFallbackAt`, `micOnlyFallbackAt` (MERGE) |
|  | Spoken language | `asrLanguage` (KEEP) |
| Microphone | Microphone | `micDeviceId` (KEEP) |
|  | Listen to _(next session)_ | `audioSource` (KEEP) |
|  | Hey Métis _(confirm)_ | new: M2-0081 |
| Meetings | Meeting assistant _(confirm)_ | new: M2-0153 |
|  | Today | new: M2-0153 (UC-100 Skip); replaces Calendar › Today's agenda |
|  | Alert me a minute before meetings | `meetingNotifications` (KEEP) |
|  | Play a chime when recording starts | `playListenChime` (KEEP) |
|  | Label speakers by voice | `speakerId` (KEEP) |
| During meetings | Suggest replies automatically | `autoSuggest` (KEEP) |
|  | Wait between suggestions _(disclosure)_ | `suggestEverySec` (ADVANCED) |
|  | Prepare suggestions ahead _(disclosure)_ | `instantSuggestions` (ADVANCED) |
|  | Show the live transcript | `showLiveTranscript` (KEEP) |
|  | Open finished meetings on the full transcript _(disclosure)_ | `showFullTranscriptInReview` (ADVANCED) |
| Names and vocabulary _(disclosure)_ | Spell known names correctly | `asrEntityBias` (ADVANCED) |
|  | Word corrections | `asrCorrections` (ADVANCED) |
| Optional local speech _(disclosure)_ | Local speech packs _(confirm; next session)_ | `asrEngine` (ADVANCED; `apple` is macOS only) |
|  | Local transcription quality | `asrQuality` (ADVANCED) |
| Desk tap control _(disclosure)_ | Desk tap control _(confirm)_ | `tapControl` (ADVANCED) |
| Capture | Stop all capture | action, always visible |

#### Knowledge & skills

| Group | Control | Keys (class) |
|---|---|---|
| Knowledge space | Knowledge space | new: M2-0125 (my space or an approved team space, sync health) |
|  | Meetings folder | `meetingsFolder` (KEEP) |
|  | Team folders | `teamTranscriptFolders` (KEEP) |
| Sharing | Publish readable meeting pages _(confirm)_ | `publishBrainPages` (KEEP) |
| Skills and modes | Available skills | new: M2-0142 (favorites) |
|  | Active mode | `mode` (KEEP), `native:metis.mode` (KEEP) |
|  | Personal instructions _(disclosure)_ | `systemPrompt` (ADVANCED) |
|  | Personal modes _(disclosure)_ | `modePrompts`, `contextDocs`, `customModes` (ADVANCED) |
|  | Answer style _(disclosure)_ | `askCaveman` (ADVANCED) |
| Memory | Remember my recent questions | `askFollowUpMemory` (KEEP) |
|  | What Métis remembers | new: M2-0137 (inspect, correct, forget; HM-13) |
| About you | About you | `profile` (KEEP) |
| Source connections _(disclosure)_ | Dust region and thinking agent | `dustBaseUrl`, `providerModelsThinking[dust]` (ADVANCED) |
| Indexing and graph _(disclosure)_ | Index meetings in batches; Passes per day | `brainConsolidation.enabled`, `brainConsolidation.maxPassesPerDay` (ADVANCED) |
|  | Build a knowledge graph _(confirm)_; Rebuild after each note; Graph engine | `graphifyEnabled`, `graphifyAutoRebuild`, `graphifyBackend` (ADVANCED) |
| Time-saved estimate _(disclosure)_ | Time-saved estimate | `timeSaved` (ADVANCED) |

#### Privacy & account

| Group | Control | Keys (class) |
|---|---|---|
| Account | Microsoft account | `entraSession` (KEEP); extended by M2-0121 |
|  | Métis licence | `operatorLicenseToken`, `operatorLicenseJti`, `operatorLicenseLast4`, `operatorLicenseExpiresAt` (KEEP) |
|  | Your plan (read-only) | `operatorTier`, `operatorEntitlements`, `operatorEntitlementsAt`, `operatorIntegrationsVersion` (OPERATOR-ONLY) |
|  | Sign out _(confirm)_ | action |
| Recording and consent | I tell participants before I record | `recordingConsent`, `native:metis.consent` (KEEP) |
|  | Remind me every time recording starts | `requireConsentIndicator` (KEEP) |
| Screen | Hide Métis in screen shares | `contentProtection` (KEEP) |
|  | Private View | `privateView` (KEEP) |
|  | Let Métis see your screen when you ask | `screenAsk` (KEEP) |
|  | Read my screen in the background, on this device _(confirm)_ | `backgroundScreenContext` (KEEP) |
| What is sent to AI | Remove secrets before sending to AI | `redactSensitive` (KEEP) |
| Storage and retention | Encrypt saved meetings _(confirm)_ | `encryptTranscripts` (KEEP) |
|  | Delete meetings after _(confirm)_ | `transcriptRetentionDays` (KEEP) |
| Connected apps | Dust | `dustWorkspaceId`, `providerModels[dust]`, `dustSession` (KEEP) |
|  | Task and CRM apps | `mcpConnections`, `mcpSecrets[<connection>]` (KEEP) |
| System permissions | Microphone permission | `permission.microphone` (KEEP) |
|  | Screen and system audio permission (macOS) | `permission.screenRecording` (PLATFORM-SPECIFIC) |
| Organization policy | Organization policy, View effective policy | `enterpriseLive` (OPERATOR-ONLY) and the policy sources of §6 |
| Your data | Delete all meetings and notes on this device _(confirm)_ | action |
|  | Export or delete my data | new: M2-0150 |

#### Advanced (drawer)

| Group | Control | Keys (class) |
|---|---|---|
| Optional local generation | Local generation model _(confirm)_ | `localLlm.enabled`, `localLlm.modelId` (ADVANCED) |
|  | Use it for | `localLlm.useFor.suggest`, `localLlm.useFor.summary` (ADVANCED), `brainConsolidation.preferLocal` (MERGE) |
|  | When to use it | `routingMode` (ADVANCED) |
|  | Use it when cloud AI is unavailable | `localLlm.fallback` (ADVANCED) |
| Optional local vision | Read screenshots on this device _(confirm)_ | `localLlm.useFor.vision` (ADVANCED) |
| Personal AI providers | Answer with | `provider` (ADVANCED) |
|  | API keys | `apiKeys[<provider>]` (ADVANCED) |
|  | Custom endpoint | `customBaseUrl` (ADVANCED) |
|  | Model overrides | `providerModels[*]`, `providerModelsThinking[*]` (ADVANCED) |
|  | Deeper thinking; Creativity; Backup order | `thinkingMode`, `temperature`, `providerFallbackOrder` (ADVANCED) |
|  | Prefer a free backup; Switch before a limit; Race a backup | `resilience.preferFreeOnExhaustion`, `resilience.budgetPreempt`, `resilience.hedge` (ADVANCED) |
| Developer integrations | Claude Code and Codex CLI | `cliConnected`, `lastClickedCli`, `cliNoticeAck` (ADVANCED) |
|  | Use my CLI subscription first | `providerPriority` (ADVANCED) |
| Organization connection | Operator address _(confirm; read-only when the organization or deployment sets it, §6)_ | `operatorUrl` (ADVANCED) |
|  | Organization sign-in setup (only while nothing else configures sign-in) | `azureClientId`, `azureTenantId`, `azureAllowedDomain` (OPERATOR-ONLY) |
| Diagnostics and updates | Usage on this device; Export logs for support; Repair speech components; Check for updates; About Métis | actions and readouts |

What leaves Settings (not settings): the Intelligence dashboard link and recent meetings (top-level views,
EXP-05), the About story and thanks (an About sheet in Diagnostics), and the Log out, Quit and Done footer
(Sign out moves to Account, Quit to Startup, Done becomes the close button because changes already apply).
The inventory's `non_settings` table lists each with its anchor.

## 5. Classification

Each class, as the inventory defines it:

| Class | Meaning | Entries |
|---|---|---|
| KEEP | An everyday control in a destination, same key and meaning (it may be relabelled). A state key with no control is KEEP when it is persisted unchanged. | 56 |
| MERGE | Kept in storage, edited through one control shared with other keys; the control maps each of its values to exact key values. | 8 |
| ADVANCED | Kept, reachable only through a labelled disclosure (the Advanced drawer or one inside a destination) and search. | 46 |
| OPERATOR-ONLY | No device control; the value comes from the organization, the Operator or the server. The device shows it read-only where it matters. | 14 |
| DEPRECATED | No control and no new writes; read only for compatibility, then removed by a versioned migration. | 14 |
| PLATFORM-SPECIFIC | Exists only where it has an effect; other platforms neither show nor search it. | 1 (plus the macOS-only `apple` value of `asrEngine`) |

The choices that needed judgement:

- **MERGE.** `uiSounds` + `soundCues` become one three-way Sounds control (Off, Clicks only, Clicks and
  cues); `uiSounds` already gates every sound (`src/renderer/src/lib/sound.ts:8-13`), so exactly three states
  are reachable and none is lost. `autoHideOverlay` is always written from the layout (`Settings.tsx:6624-6627`)
  and migrates from it (`src/shared/overlay-chrome.ts:303-308`). The four after-the-fact speech notes become
  one "Recent speech issues" list. `brainConsolidation.preferLocal` joins the other "local first for this
  task" choices under Optional local generation.
- **Speech route, the one meaning change.** `cloudSttProvider` stays KEEP, and it is the one key whose
  meaning changes, at settings version 2 (INV-1). Today the value matters only under a managed cloud-only
  profile; everywhere else a stored cloud id is ignored and local `asrEngine` transcribes
  (`src/shared/cloud-stt-provider.ts:46-54`). The first of these rules that applies decides the route:
  1. The version and the stored value come only from a readable `settings.json` (§9.1 lists what a new, a
     lost and an unreadable profile resolve to). While it is present but cannot be read or decoded, or a
     readable `.recovered` copy stands in for a missing one, they are unknown, whatever the copy records:
     only a route that organization locks fix applies, and otherwise no speech session opens (§9.1). This
     rule pre-empts the others: under managed cloud-only with no provider lock it gives no route.
  2. A profile at version 1 keeps the 1.x rule.
  3. At version 2, a managed cloud-only profile wins, with `enterpriseLive` read from managed layers only
     (below). The route is cloud whatever is stored, and `unconfigured` resolves to Cloudflare exactly as
     `effectiveCloudSttProvider` does today (`cloud-stt-provider.ts:35-44`). Speech processing offers no
     local option under it.
  4. Otherwise the stored value decides: `unconfigured` is the local route, a cloud id is that cloud route.

  Following D-11, answered on 2026-09-27 (Cloudflare speech through the Operator broker), the fresh-install
  default changes from `'unconfigured'` to `'cloudflare-nova3'` in both of its declarations,
  `DEFAULT_SETTINGS.cloudSttProvider` (`src/shared/ipc.ts:1700`) and the schema's `.default()`
  (`src/shared/ipc.ts:1169`, whose comment at 1163-1168 is rewritten to the new meaning), and
  `shouldUseCloudSttEngine` and `effectiveCloudSttProvider` take the settings version (M2-0112 with
  M2-0117.1). One stored value for "the selected engine" (MASTER §9.6) avoids a second key that could
  disagree with it. The local option is available only with an installed, verified pack; otherwise choosing
  it opens Optional local speech. `asrEngine` becomes the selected local pack inside Optional local speech.
- **Cloud-only comes from managed layers alone.** `enterpriseLive` stays managed policy, and from
  M2-0117.1 main enforces it. The profile module and the schema comment call it trusted configuration
  (`src/shared/enterprise-live-profile.ts:1-8`, `src/shared/ipc.ts:1152-1155`), but today nothing does:
  `getSettings` merges the user layer over managed values (`src/main/store.ts:709`), a settings patch keeps
  it (`src/main/store.ts:126-133`), no renderer strip removes it (`src/main/index.ts:4845-4885`), and main
  and the renderer read the merged value (`src/main/index.ts:6589`, `src/renderer/src/App.tsx:2232`). A
  renderer patch can therefore switch cloud-only on for a local-route profile, or switch off an unlocked
  managed cloud-only or summary-only setting. M2-0117.1 drops `enterpriseLive` from the user layer on read,
  the mirror of dropping `settingsVersion` from managed layers (§9.1), so the value in force comes from the
  Métis default and managed layers alone; M2-0062 strips it from renderer patches (§12). This bars renderer
  patches, not the person: the per-user managed file is theirs to edit (§6).
- **Connections follow the kit's split.** MASTER §5.6 lists connected apps among Privacy & account's
  everyday controls and source connections under Knowledge & skills' disclosure. Dust and the task and CRM
  apps receive what Métis sends them, so connecting, inspecting and disconnecting them sit in Privacy &
  account › Connected apps, never behind a disclosure (INV-5). The Dust settings that shape it as a knowledge
  source (region, thinking agent) sit in Knowledge & skills › Source connections.
- **Privacy controls that move.** `backgroundScreenContext` leaves the Speech tab for Privacy & account
  (continuous screen reading is a capture consent); `askFollowUpMemory` moves to Knowledge & skills
  (HM-13 keeps memory there); `encryptTranscripts` and `transcriptRetentionDays` move to Privacy & account.
- **OPERATOR-ONLY.** Vendor endpoints and credentials (`cloudflareBaseUrl`, `cfAiGatewayId`,
  `cloudflareAccountId`, the Soniox key) belong to the organization and, once the speech-session broker
  (M2-0107) lands, to the server (MASTER §9.6); M2-0062 strips the three settings keys from renderer patches
  (§12). `providerModelsDeep` and `providerModelsSpotlightRef` have no Settings control today and stay
  policy-set. The Entra identifiers keep their one device path: the sign-in recovery that
  `ssoBootstrapAllowed()` permits (`src/main/index.ts:4825-4836`), shown only in that case.
- **DEPRECATED.** The ten legacy license-server keys and `operatorIngestSecret` follow D-4, answered on
  2026-09-27 (DECISIONS.md): the Operator seat is the 2.0 entitlement authority, and the legacy license
  server stays read-only for existing keys until the ADR-016 deprecation decision. They are read-only until
  M2-0146, with no controls. `autoSaveTranscripts` and `sendAskText` have no effect today.
  `native:metis.language` has no reader and maps once to `asrLanguage`, only where that is still unset (S-3).
- **State keys.** Timestamps, receipts and protocol state (`onboardingDoneAt`, `lastConsentReminderAt`,
  `dustTokenMintedAt`, `usageStats`, `clickupClientId`, …) are inventoried so the migration covers them;
  they get no control. Where state belongs to a control (`cliConnected`, the licence metadata), it takes that
  control's class. `settingsVersion` is KEEP state that main alone writes (§9.1), and the one entry outside
  the base schema: `check-inventory.py` accepts it only while it carries `planned_by`, and rejects
  `planned_by` on a key the schema already has.

Per-key evidence (anchor, writer, owner, default, migration, basis) is in `inventory.json`. Every basis
carries an evidence label (OBSERVED, DERIVED or ASSUMED) and at least one `file:line` anchor at the base
commit, and `check-inventory.py` fails on any entry without both.

## 6. Effective policy

**Sources, in precedence order (OBSERVED).**

| Layer | Where | Trust |
|---|---|---|
| Métis default | `DEFAULT_SETTINGS` (`src/shared/ipc.ts:1628-1757`) | build |
| Per-user managed configuration | `userData/managed-config.json` (`src/main/store.ts:273-280`) | user-writable: a convenience, not a boundary |
| Machine policy | admin managed-config; on Windows honoured only when admin-owned (`src/main/store.ts:248-270`) | organization |
| Edition policy | `caheEditionPolicy()` returns nothing today and goes with D-30 / M2-0214 | build |
| User choice | sparse `settings.json` overrides | user |
| Locks | `locked` / `lockedKeys` from any managed layer strip the user layer on read and write (`src/main/store.ts:689-690, 783-791`) | per source |
| Environment | provider key variables, `AZURE_*`, `ASKTOTO_REQUIRE_AUTH`, `METIS_OPERATOR_URL`, … | deployment |
| Server | Operator heartbeat writes entitlements; renderer patches are stripped (`src/main/index.ts:4874-4885`) | server |

Non-schema policy keys the UI must also explain: `allowedProviders`, `egressAllowlist`, `requireAuth`,
`azure`, `escrowPubKey`, `disableAutoUpdate`, `updateFeedUrl` (anchors in `inventory.json › policy_keys`).

**What each control shows.** The value in force and one source label: "Métis default", "<Org> default"
(changeable), "Locked by <Org>", "You", "Set by this device's configuration" (per-user managed file),
"Set by deployment" (environment), "Métis Operator" (server). Locked controls render the value as text with
a lock line naming the owner and the reason (S08); the header chip counts the locks and opens the effective
policy sheet, which lists every value that is not a Métis default, with its source and reason (S09). When a
lock sets a value that applies only at the next session, the control shows the value in force and the lock
line names the value to come (S14).

**Partial locks on shared controls.** A control that writes several keys (MERGE) can be locked on only some
of them. It then disables every option or checkbox that would write another value to a locked key, and the
lock line names the locked part. With `soundCues` locked off, Sounds keeps Off and Clicks only and disables
Clicks and cues ("Answer cues are off: locked by <Org>"); with `uiSounds` locked off only Off remains, so the
control renders as a locked value. Where Métis lives works the same way on `autoHideOverlay`: locked on
disables Bar, locked off leaves only Bar. In Use it for, a locked `brainConsolidation.preferLocal` disables
its checkbox alone.

**No control that loosens policy.** MASTER §5.6 allows no Advanced control that loosens enterprise policy.
Operator address decides where the device gets its entitlements and organization integrations, so it is
editable only while no organization layer (default or lock) and no deployment variable sets `operatorUrl`;
otherwise it shows the address read-only with its source. Today `METIS_OPERATOR_URL` is copied into the user
layer at launch (`src/main/index.ts:8857-8860`), which loses that source; the effective map below resolves it
as "Set by deployment" instead.

**What M2-0117 must add (PROPOSED).**
1. `PublicSettings.effective: Record<key, { source, owner?, reason?, revision? }>` computed in main from the
   layers above, replacing the bare `managedKeys` list for rendering (the list stays for compatibility).
   Keys resolved through the nested `azure` block and through environment variables report their source too.
2. An optional non-schema managed-config key `policyInfo: { owner, revision, reasons: { <key>: text } }` so a
   lock can say who and why. Without it the UI says "Locked by your organization" and no reason.
3. Policy changes carry a revision. A change to a capture or speech setting applies at the next session
   boundary and the open window says so (S14), whether the organization adds, changes or removes a value. A
   removal is a change like any other: when an organization drops an `'unconfigured'` default from a
   version-2 profile that never chose, the route falls back to the Métis Cloudflare default and moves from
   local to cloud, so S14 names it. An emergency revocation (a key that stops capture or egress) applies
   immediately (MASTER §5.7).
4. Engines allowed by policy are a separate question from the engine selected (MASTER §9.6). The design
   proposes a managed key `allowedSpeechEngines` (absent = all qualified engines); Soniox appears in
   Speech processing only when it is allowed. ASSUMED shape; M2-0117 confirms with M2-0107.

## 7. Saving, applying and failure

| Apply kind | Controls | Behaviour |
|---|---|---|
| immediate | reversible preferences (appearance, sounds, language, shortcuts, live-assist display) | writes on change; the row shows "Saved" briefly, or the failure line |
| confirm | capture, consent-adjacent, sharing, encryption, retention, model install/select, Operator address, Replay setup, Sign out | an in-app confirmation names the consequence first; Cancel leaves everything as it was |
| next session | speech route, local pack, Listen to | saved at once, applied at the next meeting or command session; during capture the row says "Applies when this meeting ends" |

Failure (UC-099): the control keeps the confirmed value, the row shows what did not change ("Couldn't save.
Suggest replies automatically is still on.") and a Try again that retries the same change (S13). Text fields
keep the unsent draft on failure. No control ever shows a value the main process has not confirmed (INV-4),
which the current `patch` already guarantees; the change is that every call site handles the rejection.

## 8. Search and deep links

- **Index.** Every visible control's label, synonyms and help text, from the inventory. The old tab labels
  (Modes & Display, AI, Speech, Calendar, Meetings, Brain, Identity, About) are indexed through
  `legacy_tabs` and return the destination each became, so muscle memory still finds things.
  The MASTER §5.7 terms (microphone, offline, local, record, Teams, privacy, storage) each match at least one
  control; `check-inventory.py` enforces it.
- **Ranking.** Exact word or synonym, then label prefix, then word prefix, then synonym substring, then help
  text; at most eight results, each with its path ("Voice & meetings › Microphone") and the synonym that
  matched (S11).
- **Visibility.** Controls hidden by platform, policy or entitlement are not indexed. A query that only a
  hidden control would answer gets the ordinary empty result with suggested words (S12), never "hidden by
  policy" (INV-6).
- **Keyboard and IME.** Cmd/Ctrl+F focuses search; the field is a combobox over a listbox; arrows move,
  Enter opens the result and focuses its control, Escape clears. Input events during IME composition are
  ignored until composition ends, and the field is never re-created while typing, so the caret and a
  composition survive every keystroke (the prototype's first version lost the caret this way).
- **Deep links.** A control id is the anchor (`voice.microphone`). `openSettings` takes a control id or a
  destination; opening one expands the disclosures that contain it and highlights it until the next
  interaction (a static outline, no animation). The legacy tab ids map as in `inventory.json › legacy_tabs`;
  `ai` resolves to whichever control owns the failing readiness (licence, personal provider or Dust), and
  the `calendar` sign-in nudge opens Organization sign-in setup only while the recovery path is allowed.

## 9. Migration

### 9.1 Versioned steps (new; M2-0117.1 owns code and fixtures)

Add `settingsVersion` (integer). Settings version 2 is where `cloudSttProvider` takes its wider meaning
(§5), and the speech resolver reads the version: below 2 it keeps the 1.x rule, cloud speech only under a
managed cloud-only profile (`src/shared/cloud-stt-provider.ts:47-54`), so a profile whose S-1 has not
completed keeps the route it had. Each step is idempotent, runs at startup, is written in the same atomic
save as its result and is audited as `settings.migrated` with the step id. S-1 moves a profile to version 2;
S-2 and S-3 change no route, so they run at either version.

**Where the version and the speech selection come from.** Together they decide whether the Cloudflare
default can move audio to the cloud, so neither a failure nor a policy layer may supply them (INV-2):

- Main alone writes the version: `settingsVersion: 2` in every save that creates `settings.json` for a new
  profile (the table below) and in the save that completes S-1. It is on M2-0062's server-authoritative key
  list, so a renderer patch carrying it is stripped.
- It has no Métis default. Neither `DEFAULT_SETTINGS` nor the schema declares one, so a merged snapshot never
  carries a version that no user file recorded.
- Every managed layer (per-user, machine, edition) is ignored for it, value and lock alike. Managed parsing
  keeps any schema key (`src/main/store.ts:137-142`), so M2-0117.1 drops `settingsVersion` from each managed
  layer and from its lock list explicitly; a managed file cannot skip S-1.
- Main reads the version and the speech selection only from a readable `settings.json`. What `readUserRaw`
  serves otherwise (`src/main/store.ts:429-499`) decides the rest:

| `settings.json` | User layer served | Version and speech selection | Steps and writes |
|---|---|---|---|
| Readable | the file | from the file; a file without `settingsVersion` is version 1 | steps run; writes as today |
| Missing, no `.recovered` copy | empty (`store.ts:439`) | a new profile: version 2 with nothing stored, so §5 resolves the route from the Métis default (Cloudflare) and any managed layer. At its first start, before any step, main creates `settings.json` with `settingsVersion: 2`, and any later save that creates the file carries the version too | S-1 never applies. The other steps run once the file exists; if the creating save fails, no step runs at that start and main tries again at the next one. Writes as today |
| Missing, `.recovered` present but unreadable | empty (`store.ts:439`) | a lost profile, not a new one: version 1, so S-1 keeps the 1.x route and the profile never starts on the Cloudflare default | steps run; writes as today |
| Present but unreadable (`store.ts:434`) or undecodable (`store.ts:443-498`), or missing while a readable `.recovered` copy stands in | the readable copy, or none: DEFAULT + managed (`store.ts:641-646`) | unknown, whatever the copy records | no step runs, and every write is refused |

A new profile is recognised only by the absence of both files. An existing profile whose `settings.json` a
sync tool or antivirus removed, leaving no copy, is therefore taken for a new one and moves to the Cloudflare
default, but not silently: its empty user layer shows setup again (`onboardingDone` defaults to false,
`src/shared/ipc.ts:1681`), and setup names the speech route it configures before the first meeting
(M2-0160). The other profile files are no reliable sign of an older profile, because a first start can write
key files next to `settings.json` (the embedded-key seed, `src/main/index.ts:8854`): a first install whose
creating save failed would then look like a lost profile and be pinned to local speech.

A copy never supplies the version or the selection because it may be older than the profile it stands in
for: main serves it before it would preserve an undecodable live file (`src/main/store.ts:446-450`), it can
come from an earlier, unrelated incident, and nothing deletes it after a recovery (`src/main/store.ts:402`).
It still supplies the other settings for display, as today. Writes are refused because each one would merge
onto the copy and rename the result over the live file, whose bytes were never preserved
(`src/main/store.ts:802-832`), and would make the copy's version and selection the profile's without the
person seeing them. Today main refuses only when no copy stands in (`src/main/store.ts:799-807`); M2-0117.1
extends the refusal to a copy standing in. The state can last: an undecryptable file stays in place, and
M2-0076 records that it has happened.

**While the version and the selection are unknown.** Main cannot tell a legacy profile from a version-2 one,
so one rule covers both. A readiness failure cannot rewrite the selected engine (MASTER §9.6): main
substitutes no route for a selection it cannot read, and the snapshot's `cloudSttProvider` and `asrEngine`
are defaults or a copy's values, not a selection. A route applies only where organization locks fix it at
both versions. Cloud-only here is the managed layers' `enterpriseLive`, which no user layer can change (§5):

| Policy (legacy and version-2 profiles alike) | Speech route while the version and the selection are unknown |
|---|---|
| Managed cloud-only, `cloudSttProvider` locked | the locked provider (`'unconfigured'` resolves to Cloudflare): both versions route a cloud-only profile to it, and the lock strips the user layer |
| Managed cloud-only, no provider lock | none: the selected provider, Cloudflare or Soniox, cannot be read |
| Outside managed cloud-only, `cloudSttProvider` locked to `'unconfigured'` and `asrEngine` locked | the locked local pack: both versions resolve to it |
| Outside managed cloud-only, `cloudSttProvider` locked to `'unconfigured'`, `asrEngine` not locked | none: both versions route locally, but the selected pack cannot be read, and main puts no pack in place of the selected engine (MASTER §9.6) |
| Outside managed cloud-only, any other policy | none: cloud needs a version-2 selection main cannot confirm, and a local pack would stand in for a selection that may be cloud |

A cloud-only organization that needs speech to keep working through such a failure locks `cloudSttProvider`.
With no route, no speech session opens, cloud or local (MASTER §9.10). Speech processing shows no value,
because main confirmed none (INV-4). Voice & meetings shows the state in S03's layout, and M2-0076's banner
carries the recovery. The copy for M2-0117.2 follows. `<date>` is the copy's modification time. `<route>` is
the route the copy resolves to under §5 (for a legacy copy, the 1.x route S-1 would keep), named as Speech
processing names it.

| Element | Copy |
|---|---|
| Readiness title | Speech is off until Métis can load your settings |
| Readiness detail | Métis can't load its settings file, so it doesn't know where you chose to process speech, and it won't guess. Typing still works. |
| Added when a copy stands in | A copy saved on <date> is available. It uses <route> for speech. |
| Actions | Try again (primary), Type instead, and Keep the saved copy when a copy stands in |
| Speech processing value | Unknown until Métis can load your settings |
| Keep the saved copy (confirmation) | Use the settings saved on <date>? Speech will use <route> from your next meeting. Any settings file Métis can't read moves to a recovery folder; nothing is deleted. Buttons: Use saved settings, Cancel. |

The state ends in one of two ways. When `settings.json` reads again, the next session resolves from its
stored version and selection. Or the person keeps the copy, from the readiness card or M2-0076's banner:
after the confirmation, main moves the unreadable live file, when there is one, into a recovery folder, as
`archiveEncryptedProfile` does for a whole profile (`src/main/store.ts:871-914`), and writes `settings.json`
from the copy. The next session resolves from that file, and a legacy copy goes through S-1 first.

**Create new local profile.** `archiveEncryptedProfile` moves the old profile's files into a recovery folder
but leaves `settings.json.recovered` behind, because `PROFILE_RECOVERY_FIXED_FILES` omits it
(`src/main/store.ts:60-81`). Under the table above, the fresh profile is then a lost profile that S-1 pins to
local speech, or, when the copy is readable, one for which a copy of the old profile stands in. The copy
belongs to the old profile, so M2-0117.1 adds it to that list. The fresh profile is then new and starts as a
first install does (version 2, the Cloudflare default, setup shown again): the outcome the MQA-260 comment
intends (`src/main/store.ts:69-78`) and M2-0112 requires of a fresh profile. The confirmation
(`src/main/index.ts:5090-5093`) adds that the new profile starts with the Métis defaults, Cloudflare speech
among them, so the person starts the new route knowingly.

| Step | Applies to | Change | Why |
|---|---|---|---|
| S-1 | every profile at version 1 | Compute the 1.x route and the 2.0 route (§5) from the same Métis default, managed and user layers. Where they differ, write `cloudSttProvider: 'unconfigured'` to the user layer, which keeps the 1.x route; where they agree, write nothing. Then, if the Métis default layer supplies `asrEngine` (absent from the user layer and set by no managed layer), persist its effective value. Offer the speech choice once (S16) wherever the kept route is local and policy leaves the choice to the person. | The routes can differ in one way only: outside managed cloud-only, the 2.0 value is a cloud id. That is the new Cloudflare default (D-11, answered 2026-09-27), a cloud id left in the user layer by an earlier managed cloud-only profile, or an organization default. Each would start sending audio to the cloud at upgrade, which INV-2 and MASTER §9.6 forbid. |
| S-2 | `localLlm.enabled` with no model on disk | keep it selected; show "Download needed (bytes)" instead of downloading at launch | install is an explicit act with the size shown first (MASTER §14.8) |
| S-3 | any profile | drop `autoSaveTranscripts` and `sendAskText`; on the native app, map `native:metis.language` into `asrLanguage` only when `asrLanguage` is absent from the user layer, and name the change in S16 ("Your Mac app language, French, now sets Spoken language") | the dropped keys have no effect; the language choice had none either, so it may fill an unset value but never override one, and the person is told it now applies |

S-1 on the cases that matter (each at version 1 before the step):

| Profile | `cloudSttProvider` in the user layer | 1.x route | 2.0 route if nothing is written | S-1 writes |
|---|---|---|---|---|
| Outside cloud-only, never chose | absent | local | Cloudflare (new default) | `'unconfigured'` |
| Outside cloud-only after the organization removed cloud-only | `'soniox'` or `'cloudflare-nova3'`, chosen while cloud-only applied | local (`shouldUseCloudSttEngine` ignores it) | that cloud provider | `'unconfigured'`, replacing it; S16 says the earlier cloud choice belonged to the organization profile that no longer applies |
| Outside cloud-only, organization default is a cloud id | absent | local | that provider | `'unconfigured'` |
| Managed cloud-only, no provider stored | absent | Cloudflare | Cloudflare (§5 rule 3) | nothing: the routes agree, and a user-layer `'unconfigured'` would record a local choice the person never made, one that would take effect the day the organization lifts cloud-only |
| Managed cloud-only with Soniox | `'soniox'` | Soniox | Soniox | nothing |
| Outside cloud-only, organization lock on a cloud id | stripped by the lock | local | that provider | nothing: see below |

Organization-locked keys are never written by a step, and managed defaults are never persisted into the user
layer. A lock on a cloud id outside cloud-only was inert in 1.x, so it cannot start uploading audio merely
because Métis was upgraded: S-1 does not complete for that profile. The profile stays at version 1 and keeps
the local route, and the effective policy sheet lists the organization value as not applied, naming the
conditions under which it would apply ("Not applied: it would send meeting audio to <provider>, which an
upgrade never starts on its own. It applies if <Org> turns on cloud-only speech."). S-1 runs again at each
start and completes once the managed configuration no longer changes the route. If the organization turns
on cloud-only, the locked value applies as a policy change the person sees (INV-2, S14); if it removes the
lock, S-1 completes like any unlocked profile and the local route is kept. Any other failed step keeps the
profile at its previous version, loads it with its previous effective values and reports through the
unreadable-settings path (M2-0076).

S16 reports what the upgrade did. Its line "Everything you chose is unchanged" appears only when S-1
replaced no stored cloud id and S-3 mapped no language; otherwise S16 names each of those changes in its
place.

### 9.2 Existing on-read migrations (kept unchanged)

BidStack fields to `mcpConnections`, retired providers and model ids, `qwen3.5-2b`, the legacy
`autoHideOverlay` boolean and `lockedKeys`, each with its anchor in `inventory.json › legacy`. The deliberate
absence of a `contentProtection` → `privateView` remap (`src/main/store.ts:665-671`) stays.

The flat `enterpriseLive*` managed keys are not among them: they are recorded there as deprecated.
`resolveEnterpriseLiveProfile` accepts them (`src/shared/enterprise-live-profile.ts:41-50`), but managed
parsing drops every key the schema lacks (`src/main/store.ts:126-142`), and every caller passes the nested
value, which the schema default always supplies (`src/main/index.ts:6589`, `src/main/transcripts.ts:767`).
They have never had an effect. M2-0117.1 removes that branch with the user-layer drop of `enterpriseLive`
(§5); nothing migrates.

### 9.3 Native Mac parity

The native app reads and writes the registry keys (`mode`, `recordingConsent`, `onboardingDoneAt`, and
`asrLanguage` for its language picker) instead of its own UserDefaults keys, and its privacy copy states the
effective speech route instead of "nothing is uploaded". Owner: M2-0117 with the native onboarding work
(M2-0161).

### 9.4 Regression fixtures for M2-0117.1

- Speech route, one fixture per S-1 case above: fresh profile (neither `settings.json` nor a `.recovered` copy
  exists: main creates `settings.json` with version 2 before any step, S-1 does not run, no S16, route
  Cloudflare); a fresh profile whose creating save fails (no step runs at that start, route Cloudflare, a
  later save that creates the file carries version 2, and otherwise the next start creates it; S-1 never
  runs); completed sparse legacy profile on Parakeet;
  incomplete legacy profile on a large-memory Mac (its hardware engine is pinned); explicit Whisper; a cloud
  id left in the user layer after the organization removed cloud-only (rewritten to `'unconfigured'`, route
  stays local, S16 names the replaced choice instead of "Everything you chose is unchanged"); an organization
  default cloud id outside cloud-only; managed cloud-only with no provider stored (no user-layer write, route
  Cloudflare); managed cloud-only with Soniox; an organization lock on a cloud id outside cloud-only (no
  write, version stays 1, route local, policy sheet marks it not applied; S-1 completes with the local route
  kept after the lock is removed, and with the locked route after cloud-only is turned on); an S-1 save that
  fails (version stays 1, route local); an organization `'unconfigured'` default outside cloud-only (the
  routes agree, so S-1 writes nothing and the profile reaches version 2 on the local route; when the
  organization later removes that default, the route moves to Cloudflare only at the next session boundary,
  with S14 naming it, never during a session).
- Version source: a per-user or machine managed-config carrying `settingsVersion: 2`, and one locking
  `settingsVersion` (both ignored: a legacy profile still resolves as version 1 and S-1 runs); a renderer
  patch carrying `settingsVersion` (stripped); a missing `settings.json` with only an unreadable
  `.recovered` copy (not a new profile: version 1, and S-1 keeps the 1.x route, so the profile never starts
  on the Cloudflare default); Create new local profile with a `.recovered` copy present, readable and not
  (the copy moves into the recovery folder with the rest, and the fresh profile is new: version 2, route
  Cloudflare, setup shown).
- Version and selection unknown, entering the state: `settings.json` held open by another process,
  undecodable with no readable copy, undecodable with a readable copy, and missing with a readable copy.
  Each gives the unknown state: no step runs, a settings write is refused, and a live file's bytes are
  unchanged on disk.
- Version and selection unknown, the route: one fixture per row of the §9.1 policy table, each for a legacy
  and a version-2 profile (the locked provider or pack where locks fix the route, no route otherwise).
  Among them:
  - a version-2 profile on Cloudflare, once from the fresh default and once from an explicit choice, whose
    `settings.json` is unreadable at startup: no speech session opens, cloud or local, and main refuses
    `IPC.cloudSttStart` (§12); Voice & meetings shows the §9.1 copy and the M2-0076 banner; Speech
    processing shows no value; once the file reads again, the next session uses Cloudflare;
  - a version-2 profile that chose local speech, whose `settings.json` is undecodable while an older
    version-2 `.recovered` copy on Cloudflare decodes: no cloud session opens, nor a local one, and main
    refuses `IPC.cloudSttStart`;
  - an upgraded profile that explicitly chose Cloudflare, whose `settings.json` is undecodable while a
    pre-upgrade legacy `.recovered` copy decodes: S-1 writes nothing, S16 does not appear, and the live
    file's bytes are unchanged on disk.
- Keep the saved copy, for a missing and for an undecodable `settings.json`: the confirmation names the
  copy's route; afterwards an undecodable file sits byte for byte in a recovery folder, `settings.json`
  holds the copy, and the next session uses the copy's route (after S-1 for a legacy copy). Cancel changes
  nothing.
- `enterpriseLive`: a user-layer value is ignored on read, both a cloud-only one on a local-route profile
  (the route stays local, main refuses `IPC.cloudSttStart`, and summary-only stays off) and a legacy one
  under an unlocked managed cloud-only default (the managed cloud-only and summary-only values still
  apply); a renderer patch carrying it is stripped (M2-0062).
- `asrEngine`: managed-locked, and a managed unlocked default; neither is persisted by S-1.
- `localLlm.enabled` without weights; BidStack legacy fields with and without an explicit empty
  `mcpConnections`; Cahê-written settings (M2-0214).
- Native UserDefaults with each language value, with and without `asrLanguage` in the user layer.

Each asserts the route and the effective values before and after, that no route changed other than through a
policy change the fixture makes, and that the step is a no-op on its second run.

## 10. States and evidence

**Status (OD-12).** The owner has ruled that Métis is the installed Electron app on macOS and Windows and that
standalone HTML prototypes are internal review artifacts. The prototype and captures below are therefore a
superseded HTML mock: design reference for M2-0117.2, not app evidence. Every state in the table is to be
captured again from the Electron renderer in CI (D-28), which needs the destinations that M2-0117.2 builds.
OD-12 forbids opening the mock or running `capture.js` on the owner's machine: no agent drives a browser
there for program work, and the captures are how the mock is seen. `capture.js` is kept only as the record
of how the superseded captures were made.

The concept prototype rendered each state from `inventory.json` plus example data in `states.js` (labelled
"Design prototype · example data" in every capture, MASTER §5.5). `capture.js` served `design/settings/`
from disk through a routed origin and rendered every state in its own Playwright browser context; it took
that folder from the shared tab's URL fragment, so no checkout path is written in it.

| State | Shows | Kit link |
|---|---|---|
| S01-general | General, fresh install | M2-SET-01 |
| S02-voice-ready | Voice & meetings with Cloudflare ready, local speech not installed | §9.6 default, UC-097 |
| S03-voice-unavailable | cloud speech unavailable: typing offered, no silent switch to local, a recent-issue row | §9.10, UC-072 |
| S04-local-speech-review | packs with bytes, languages, fit, one unsupported with its reason | §14.7–14.8, UC-070 |
| S05-local-speech-downloading | progress, Pause, Cancel, pauses during meetings | §14.8 |
| S06-local-speech-installed | installed, not selected; Cloudflare still selected | UC-071, COV-20 |
| S07-knowledge | Knowledge & skills | HM-13, EXP-01 |
| S08-privacy-managed | locked controls with owner and reason | M2-SET-02 |
| S09-policy-sheet | effective policy: value, source, reason | §5.7 |
| S10-advanced | Advanced drawer: local generation and vision apart, personal providers | §5.6 |
| S11-search | "mic": synonyms, paths, keyboard selection | §5.7, UC-097 |
| S12-search-empty | "anthropic" while policy hides personal providers: the ordinary empty result, nothing revealed | INV-6 |
| S13-save-failed | failed save, confirmed value kept, Try again | UC-099 |
| S14-policy-changed | policy revision during a meeting: the meeting keeps local speech, the locked Cloudflare value is shown as applying when it ends; Stop all capture in the header | UC-099, §5.7 |
| S15-narrow | 360 px: destination full width with Back | EXP-05, §5.9 |
| S16-migrated | first open after upgrade, for a profile where S-1 replaced no stored cloud id and S-3 mapped no language: where things moved, and the speech choice | UC-098, §9.6 |
| S17-connected-apps | Privacy & account › Connected apps: Dust and task apps next to storage and permissions | §5.6 |

**Captures.** 17 states × light/dark × 1x/2x × motion/reduced motion = 136 captures under
`evidence/M2-0101/design/<state>/<theme>-<scale>x-<motion>.png`. A reduced-motion capture byte-identical to
its full-motion twin is recorded against the twin's file. All 68 are, so the 136 captures are stored as 68
files. `manifest.json` labels them a superseded HTML mock and lists all 136 with file, sha256 and pixel
size. Because the settled screens do not move, the reduced-motion screenshots add no evidence about motion;
that evidence is the transition durations `audit.js` computes for every capture. The captures were
rendered from the inputs whose hashes `manifest.json › inputs_sha256` records. Two inputs have changed since,
neither in what was rendered. `inventory.json` has changed only in `keys` (the basis and migration texts of
13 entries, the dropped `assumed_decisions` arrays and the new `settingsVersion` entry) and in `legacy` (the
`cloudSttProvider` rule and the two `enterpriseLive` rows), which the prototype does not read: it renders
`controls` and `destinations` alone. `capture.js` has changed only in its header comment, which now records
OD-12 instead of telling the reader how to run it; its hash differs for that reason alone.

**Automated checks** (`prototype/audit.js`, run in page for every capture; results in `audit.json`):
WCAG 2.2 AA text contrast (1.4.3) for every rendered text node, input value, placeholder and select; non-text
contrast (1.4.11) of every toggle, segmented control, card option, select and input edge, and of the focus
indicator against every surface; clipped text (including text cut by a select or input); horizontal scrolling
and content outside the window; transitions at most 200 ms, none under reduced motion, no animation running
after settle. Result: 136 of 136 pass; 9,920 text and 1,360 non-text contrast checks; lowest focus indicator
ratio 5.85:1; longest transition 150 ms, 0 ms under reduced motion. The harness waits until
`document.getAnimations()` is empty before it audits, so on an ordinary capture the "no animation running
after settle" check cannot fail; only the negative control, which adds a transition after the settle, shows
that it detects one. The negative control injects five known defects (low-contrast text, an invisible toggle
edge, a clipped label, a clipped select value, a 400 ms transition) and the audit reports every one
(`audit.json › negative_control`).

**Interaction checks** (same harness, driven through the accessibility tree; `audit.json › interactions`,
6 of 6 pass): choosing Local speech without a ready pack opens Optional local speech instead of switching;
Cmd+F, typing and Enter land on the control with focus; a consequential change asks first and Cancel keeps
the value; a confirmed change saves and says so; a reversible preference applies at once; a failed save
keeps the confirmed value and explains it.

What this does not prove: rendering in the Electron app or native Mac, screen-reader output, and real
usability. Those are M2-0117's LOCALLY_TESTED evidence and the §11 study. The states show whole-control
locks only; partial locks on shared controls (§6) are M2-0117.2's to test.

## 11. Task flows and acceptance plan

Navigation transitions count sidebar selections and disclosures; typing in search is one transition.

| # | Task (MASTER §5.9, §8.13, EXP-05) | Path | Transitions | Passes when |
|---|---|---|---|---|
| T1 | Change the microphone | Voice & meetings › Microphone, or search "mic" | 1 | the new device is selected, Test shows a level, the choice survives a restart |
| T2 | Pause automatic attendance for one meeting | Voice & meetings › Today › Skip | 1 | only that occurrence is skipped; other workflows unchanged (UC-100) |
| T3 | Inspect privacy | Privacy & account (summary card first) | 1 | the person can say what Métis sees, records and sends, and who manages any lock |
| T4 | Enable an allowed offline pack | Voice & meetings › Optional local speech › Download, then Use for speech | 2 | bytes shown before download; nothing selected until Use for speech; the route changes only at the next session |
| T5 | Find an available skill | Knowledge & skills › Available skills | 1 | the skill is found and can be favorited |
| F6 | Upgrade (UC-098) | first open shows S16 | 0 | every explicit choice kept; speech route unchanged until the person chooses |
| F7 | Save fails (UC-099) | any control | 0 | S13 behaviour; nothing shows as on that is off |
| F8 | Policy changes remotely | open window | 0 | S14 behaviour; the change applies at the session boundary |
| F9 | Understand a locked control | lock line or chip › View policy | 1 | owner and reason visible without leaving Settings |
| F10 | Recover from a readiness error | error link opens the owning control | 0 | lands on the control, focused |
| F11 | Back-to-back meetings | change Listen to during a meeting | 0 | the running meeting keeps its capture; the next one uses the new value |

**Study (EXP-05 acceptance).** At least eight nontechnical participants on Windows, native Mac and the
narrow layout complete T1–T5 plus a permission-denied variant of T1 and the back-to-back case F11. Measure
unassisted completion, mistakes and time; target at least 90% completion, no privacy-critical
misunderstanding, and at most two transitions per ordinary task. Small studies are design evidence, not
proof (MASTER §5.9). Owner: M2-0117 with the release study.

## 12. Hand-off to implementation

- **M2-0117.1** moves `inventory.json` to `src/renderer/src/features/settings/inventory.json` (the ticket's
  scope path). It cannot move verbatim: the public repository takes ticket ids only, and the inventory
  carries private program references. In `basis`, `notes`, `migration`, `rule` and `disposition` text,
  M2-0117.1 replaces each decision id with the ticket that owns the question (D-4 → M2-0146, D-11 → M2-0112,
  D-30 → M2-0214), drops kit references (MASTER sections and kit requirement ids such as UC-, HM-, SRC-,
  EXP- and M2-SET- ids) and references to this document, and keeps every code anchor. It adds
  `scripts/settings/check-inventory.mjs`, which replaces `check-inventory.py` and enforces its rules against
  the live zod schema as a CI step (every schema key and leaf classified, no stale keys or leaves,
  `planned_by` only on keys the schema does not have yet, class rules, control and key bindings in both
  directions (a key's control lists that key, and every key a control lists is bound to that control), a
  labelled and anchored basis on every entry, required synonyms, Privacy never behind a disclosure) and also
  rejects any decision id or kit reference, so the public copy cannot drift back. It
  implements §9 with the §9.4 fixtures, including the store changes §9.1 names (the write refusal while a
  `.recovered` copy stands in, and `settings.json.recovered` in the profile archive), and it reads
  `enterpriseLive` from managed layers only and removes the unused flat branch (§5, §9.2).
- **M2-0112** changes the fresh-install default and the speech resolver (§5) against the `settingsVersion`
  contract of M2-0117.1; the version gate makes their landing order safe, because a profile below version 2
  keeps the 1.x route. Main enforces the route as well as the renderer: `IPC.cloudSttStart` resolves the
  provider but never checks the route (`src/main/index.ts:6588-6592`), so under a Cloudflare default a
  renderer bug could open a cloud session for a local-route profile. Before it opens a session, main applies
  the version-aware `shouldUseCloudSttEngine` and refuses when the route is local, or when there is none
  because the version and the selection are unknown (§9.1). The check is sound only because
  `enterpriseLive` comes from managed layers alone (§5): today a renderer patch
  `{enterpriseLive: {managed: true, inferenceMode: 'cloud-only'}}` would pass it. M2-0112 adds the check,
  and M2-0107 carries it into the speech-session broker.
- **M2-0117.2** renders destinations, groups and controls from the registry (MASTER §5.7), implements §6–§8,
  and records LOCALLY_TESTED evidence with behaviour tests (search ranking and visibility, deep-link
  resolution, failure and retry, lock rendering, next-session apply).
- **M2-0117.3** implements the pack states of S04–S06 against M2-0115 and M2-0163.
- **M2-0076** shows its unreadable-settings banner whenever §9.1 marks the version and the selection
  unknown, with Keep the saved copy among its recovery options while a copy stands in.
- **M2-0062** (one server-authoritative key list) and **M2-0071** (the Settings.tsx split) come first.
  M2-0062's constant covers two sets of the inventory's settings entries: every entry whose `write` is
  `"main"`, `"server"` or `"managed"`, and every OPERATOR-ONLY or DEPRECATED entry, none of which 2.0 gives a
  control that writes it. The three `azure*` keys are the one exception: the sign-in recovery (§5) stays
  their device path. The first set includes `settingsVersion` (§9.1) and the managed `enterpriseLive`,
  `cloudflareBaseUrl`, `providerModelsDeep`, `providerModelsSpotlightRef` and `sendAskText`. The second adds
  six keys that the renderer writes today:
  - `cloudflareAccountId` and `cfAiGatewayId` choose the Cloudflare account and gateway that main's live
    speech socket connects to, carrying the device's Cloudflare token (`src/main/index.ts:6619-6622`). The
    default `cloudflareBaseUrl` is the Worker URL, which has no `/accounts/` path, so the account comes from
    `cloudflareAccountId` (`src/main/cloud-stt/credentials.ts:46-59`). Today a renderer patch can therefore
    point meeting audio at another account or gateway.
  - `licenseServerUrl` and `licenseGateEnabled`, the legacy licence server's address and gate, which D-4
    keeps read-only and today's strip leaves writable on purpose (`src/main/index.ts:4841`), and
    `operatorIngestSecret`, the legacy ingest secret, which 2.0 gives no entry field.
  - `autoSaveTranscripts`, which has no effect and which S-3 drops.

  Their strip takes effect in M2-0062's first release, before M2-0107 and before M2-0117.2 replaces
  today's Settings. `SettingsPatch` then excludes these keys, so the same change removes the renderer writes
  that remain: the two pairs of Cloudflare account and gateway fields (`Settings.tsx:1551-1574, 6815-6836`),
  the legacy administrator connection (`Settings.tsx:6326-6337, 7146-7165`) and the compiled-off licence
  section's two patches (`Settings.tsx:8385, 8483`). No control is left writing a key that main discards.
  The strip covers writes only. Stored values stay in force until their own migration, so a device where
  Nova is already configured keeps working until M2-0107 moves the account and gateway into the
  speech-session broker, and an organization whose people type the account or gateway id by hand today sets
  it through managed configuration instead.

  One speech credential sits outside every settings patch: the Soniox key, which the renderer sets through
  `IPC.cloudSttSetSonioxKey` (`src/main/index.ts:6682-6689`) and which alone chooses the Soniox account. It
  stays a device seat, shown only under a cloud-only profile, until M2-0107 moves speech credentials to the
  server (`apiKeys[soniox]` in the inventory).
- The comment at `src/shared/ipc.ts:1259-1263` is corrected with M2-0117.3.

## 13. Open questions

1. Speaker labels are on by default and derive voice characteristics to tell speakers apart. Whether that is
   special-category data needing explicit consent in some jurisdictions is a legal-privacy question for the
   owner (UNKNOWN); the design keeps the toggle in Voice & meetings with the explanation inline.
2. The shape of `policyInfo` and `allowedSpeechEngines` (§6) is PROPOSED; the Operator policy surface
   (D-16, M2-0158) may prefer to deliver them from the server.
3. An organization lock on a cloud id outside cloud-only holds a profile at version 1 until the organization
   turns on cloud-only or removes the lock (§9.1). Whether a policy revision published after the upgrade
   should release it instead, applying the value as a visible S14 change at the next session, is an owner
   question; that release would depend on the policy revision of §6.

## 14. Acceptance status

| Criterion | Status | Evidence |
|---|---|---|
| Every setting classified in the six classes | MET | `inventory.json`; `evidence/M2-0101/design/inventory-check.txt` (115 keys, 150 leaves, one planned key, every entry with a labelled and anchored basis, control and key bindings consistent both ways, PASS; each negative control fails: a control listing a key bound elsewhere, the planned key without `planned_by`, `planned_by` on a key the schema has, and an inventoried leaf the schema lacks) |
| Four destinations plus search designed with task flows | MET | §4, §8, §11; prototype states S01–S17 |
| Mapped to stable keys and actual policy semantics; migration table for legacy keys | MET | §5, §6, §9; `inventory.json › keys, legacy, legacy_tabs, policy_keys` |
| Design evidence: states × light/dark × 1x/2x × reduced motion, checked against the spec with automated WCAG AA contrast and clipping checks | PARTIAL | 136 captures in 68 files of the superseded HTML mock, all passing, checked against the kit sections (`evidence/M2-0101/design/manifest.json`, `audit.json`); under OD-12 they are design reference, and the Electron-renderer captures are not made yet (§10); the M2-0201 prototype it should also be checked against does not exist yet |
| Validated by an Opus session other than the implementer | PENDING | validator session |
| `node scripts/settings/check-inventory.mjs` | NOT RUN | lands with M2-0117.1 (§12); the equivalent static check passed |

The M2-0201 prototype does not exist yet; this design's own prototype is the reference it should adopt for
Settings.
