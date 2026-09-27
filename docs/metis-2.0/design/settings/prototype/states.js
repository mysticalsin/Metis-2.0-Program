'use strict'
/* Example data for the Settings 2.0 prototype (M2-0101). Every value here is illustrative: the product
   renders real state from the settings registry, never these labels (MASTER §5.8). Each state below is one
   row of the design state list in ../SETTINGS-2.0.md §10. */

window.SETTINGS_BASELINE = {
  platform: 'darwin',
  organization: null,
  view: 'detail',
  values: {
    overlayLayout: 'hide', autoHideOverlay: true, overlayPlacement: 'top-center', overlayOrbStyle: 'jakub',
    overlayOpacity: 1, quickActionsRainbow: true, outputLanguage: 'auto', summaryLanguage: 'auto',
    uiSounds: true, soundCues: true, launchAtLogin: false, onboardingDone: true,
    cloudSttProvider: 'cloudflare-nova3', asrEngine: 'parakeet', asrQuality: 'best', asrLanguage: 'auto',
    micDeviceId: '', audioSource: 'both', meetingNotifications: false, playListenChime: true, speakerId: true,
    autoSuggest: true, suggestEverySec: 8, instantSuggestions: true, showLiveTranscript: false,
    showFullTranscriptInReview: false, asrEntityBias: true, mode: 'general', askFollowUpMemory: false,
    askCaveman: 'full', publishBrainPages: false, encryptTranscripts: true, transcriptRetentionDays: 0,
    recordingConsent: true, requireConsentIndicator: true, contentProtection: true, privateView: false,
    screenAsk: true, backgroundScreenContext: false, redactSensitive: true, graphifyEnabled: true,
    graphifyAutoRebuild: true, graphifyBackend: 'auto', 'brainConsolidation.enabled': true,
    'brainConsolidation.maxPassesPerDay': 2, 'brainConsolidation.preferLocal': false,
    'localLlm.enabled': false, 'localLlm.useFor.suggest': false, 'localLlm.useFor.summary': false,
    'localLlm.useFor.vision': false, 'localLlm.fallback': false, routingMode: 'auto', provider: 'cloudflare',
    thinkingMode: 'auto', temperature: 0.4, 'resilience.preferFreeOnExhaustion': true,
    'resilience.budgetPreempt': true, 'resilience.hedge': true, providerPriority: 'api', customBaseUrl: ''
  },
  locks: {},
  hidden: [],
  capture: null,
  banners: [],
  sheet: null,
  speechIssues: [],
  readiness: {
    general: { status: 'good', title: 'Métis is set up', detail: 'Hidden at the top center. Answers match the conversation language.' },
    voice: { status: 'good', title: 'Speech is ready', detail: 'Cloudflare transcribes meetings and commands. Microphone: system default (MacBook Pro Microphone).' },
    knowledge: { status: 'good', title: 'Knowledge is up to date', detail: 'My space, synced 2 minutes ago. Dust connected.' },
    privacy: { status: 'good', title: 'What Métis can see, record and send', detail: 'Your screen only when you ask. Recording only when you start it, after your consent. Saved meetings are encrypted on this device.' },
    advanced: { status: 'good', title: 'Optional features are off', detail: 'Nothing here is needed for everyday use. Nothing downloads or runs until you turn it on.' }
  },
  speechPacks: [
    { id: 'parakeet', title: 'Parakeet', state: 'compatible', recommended: true, size: '470 MB download', cta: 'Download 470 MB', languages: '25 European languages', note: 'Fits this Mac: 16 GB memory, 212 GB free.' },
    { id: 'whisper', title: 'Whisper', state: 'compatible', size: '1.5 GB download', cta: 'Download 1.5 GB', languages: 'About 100 languages', note: 'Slower on this Mac than Parakeet.' },
    { id: 'apple', title: 'Apple Speech', state: 'compatible', size: 'Downloaded by macOS per language', cta: 'Set up in macOS', languages: 'Languages installed in macOS', note: 'Uses the recognizer built into macOS.', platforms: ['darwin'] }
  ],
  generationPacks: [
    { id: 'qwen3.5-0.8b', title: 'Small local model', state: 'compatible', size: '730 MB download', cta: 'Download 730 MB', languages: 'Suggestions and summaries', note: 'Fits this Mac.' },
    { id: 'qwen3.5-4b', title: 'Larger local model', state: 'unsupported', size: '3.1 GB download', languages: 'Better summaries', note: 'Needs 12 GB of free memory; this Mac has 7.8 GB available now.' }
  ],
  today: [
    { time: '09:30', title: 'Weekly pipeline review', status: 'Métis will join', eligible: true },
    { time: '13:00', title: 'Client workshop', status: 'Not eligible: external organizer', eligible: false },
    { time: '16:00', title: 'Team retro', status: 'Skipped for this meeting', eligible: true, skipped: true }
  ],
  skills: [
    { title: 'Meeting recap', meta: 'Mantu · version 3', favorite: true },
    { title: 'Sales call recap', meta: 'Mantu · version 2', favorite: true },
    { title: 'Follow-up email', meta: 'Mantu · version 5', favorite: false }
  ],
  permissions: { 'privacy.permission-microphone': 'Allowed', 'privacy.permission-screen': 'Allowed' },
  summaries: {
    'general.shortcuts': 'Ask: Command Return. Listen: Command Shift L. 10 more.',
    'voice.microphone': 'Now using MacBook Pro Microphone',
    'voice.corrections': '3 corrections',
    'voice.desk-tap': 'Off',
    'knowledge.space': 'My space · synced 2 minutes ago',
    'knowledge.meetings-folder': 'OneDrive › Métis Meetings',
    'knowledge.team-folders': 'None',
    'knowledge.personal-instructions': 'Not set',
    'knowledge.personal-modes': '2 personal modes',
    'knowledge.memory': 'Facts from 14 meetings',
    'knowledge.about-you': 'Name, role and company set',
    'knowledge.dust-options': 'Region: US · thinking agent: default',
    'knowledge.time-saved': '20% of meeting length, 5 to 30 minutes',
    'privacy.microsoft-account': 'Signed in with your work account · Mantu',
    'privacy.dust': 'Connected · Mantu workspace · agent Métis',
    'privacy.task-apps': 'ClickUp connected · Plane not connected',
    'privacy.licence': 'Active · renews in 4 months · key ending 7F2A',
    'privacy.plan': 'Métis · Ask, Listen, Recap and Intelligence',
    'privacy.org-policy': 'No organization policy on this device',
    'advanced.api-keys': 'No personal keys',
    'advanced.custom-endpoint': 'Not set',
    'advanced.model-overrides': 'Recommended models',
    'advanced.backup-order': 'Default order',
    'advanced.cli': 'Not connected',
    'advanced.operator-url': 'Default Operator',
    'advanced.usage': '38 answers this week · median first word 1.2 s'
  },
  policy: []
}

const MANAGED = {
  organization: { name: 'Mantu IT', revision: 12 },
  locks: {
    contentProtection: { owner: 'Mantu IT', reason: 'Required so clients never see Métis in a shared screen.' },
    transcriptRetentionDays: { owner: 'Mantu IT', reason: 'Company retention policy: 90 days.' },
    redactSensitive: { owner: 'Mantu IT', reason: 'Required before any text reaches an AI provider.' }
  },
  values: { transcriptRetentionDays: 90 },
  policy: [
    { setting: 'Hide Métis in screen shares', value: 'On', source: 'Locked by Mantu IT', why: 'Clients never see Métis in a shared screen.' },
    { setting: 'Delete meetings after', value: '90 days', source: 'Locked by Mantu IT', why: 'Company retention policy.' },
    { setting: 'Remove secrets before sending to AI', value: 'On', source: 'Locked by Mantu IT', why: 'Required before any text reaches an AI provider.' },
    { setting: 'Speech processing', value: 'Cloudflare', source: 'Mantu IT default', why: 'You can choose local speech.' },
    { setting: 'AI providers allowed', value: 'Managed AI, Dust', source: 'Mantu IT policy', why: 'Data-processing agreements in place.' }
  ],
  summaries: { 'privacy.org-policy': 'Mantu IT manages 3 settings on this device (policy revision 12)' }
}

/** An upgraded profile that kept local speech: Parakeet is installed and transcribes on this device. */
const PARAKEET_IN_USE = [
  { id: 'parakeet', title: 'Parakeet', state: 'in-use', size: '470 MB on disk', languages: '25 European languages', note: 'Verified. Transcribes on this device.' },
  ...window.SETTINGS_BASELINE.speechPacks.slice(1)
]

window.SETTINGS_STATES = [
  { id: 'S01-general', title: 'General, fresh install', destination: 'general' },
  { id: 'S02-voice-ready', title: 'Voice & meetings, Cloudflare ready', destination: 'voice' },
  {
    id: 'S03-voice-unavailable', title: 'Cloud speech unavailable, no silent switch', destination: 'voice',
    patch: {
      readiness: {
        voice: {
          status: 'bad', title: 'Cloud speech is unavailable',
          detail: 'This computer is offline. Typing still works. Local speech is not selected, so Métis will not switch to it on its own.',
          actions: [{ label: 'Try again', primary: true }, { label: 'Type instead' }]
        }
      },
      speechIssues: [
        { title: 'A recent meeting captured your microphone only', detail: 'The other side was not recorded. Screen and system audio permission is off.', action: 'Open System Settings', when: 'Yesterday 16:40' }
      ]
    }
  },
  {
    id: 'S04-local-speech-review', title: 'Optional local speech, review before download', destination: 'voice',
    open: ['voice.local-speech'], scrollTo: 'voice.local-speech-packs',
    patch: {
      speechPacks: [
        { id: 'parakeet', title: 'Parakeet', state: 'compatible', recommended: true, size: '470 MB download', cta: 'Download 470 MB', languages: '25 European languages', note: 'Fits this Mac: 16 GB memory, 212 GB free.' },
        { id: 'whisper', title: 'Whisper', state: 'unsupported', size: '1.5 GB download', languages: 'About 100 languages', note: 'Needs 4 GB of free memory while a meeting runs; this Mac has 2.1 GB available now.' },
        { id: 'apple', title: 'Apple Speech', state: 'compatible', size: 'Downloaded by macOS per language', cta: 'Set up in macOS', languages: 'Languages installed in macOS', note: 'Uses the recognizer built into macOS.', platforms: ['darwin'] }
      ]
    }
  },
  {
    id: 'S05-local-speech-downloading', title: 'Optional local speech, downloading', destination: 'voice',
    open: ['voice.local-speech'], scrollTo: 'voice.local-speech-packs',
    patch: {
      speechPacks: [
        { id: 'parakeet', title: 'Parakeet', state: 'downloading', progress: 0.38, size: '178 of 470 MB', languages: '25 European languages', note: 'Pauses automatically during meetings. Verified before it can be used.' },
        { id: 'whisper', title: 'Whisper', state: 'compatible', size: '1.5 GB download', cta: 'Download 1.5 GB', languages: 'About 100 languages', note: 'Slower on this Mac than Parakeet.' },
        { id: 'apple', title: 'Apple Speech', state: 'compatible', size: 'Downloaded by macOS per language', cta: 'Set up in macOS', languages: 'Languages installed in macOS', note: 'Uses the recognizer built into macOS.', platforms: ['darwin'] }
      ]
    }
  },
  {
    id: 'S06-local-speech-installed', title: 'Optional local speech, installed but not selected', destination: 'voice',
    open: ['voice.local-speech'], scrollTo: 'voice.local-speech-packs',
    patch: {
      speechPacks: [
        { id: 'parakeet', title: 'Parakeet', state: 'installed', size: '470 MB on disk', languages: '25 European languages', note: 'Verified. Not in use: Cloudflare is still selected.' },
        { id: 'whisper', title: 'Whisper', state: 'compatible', size: '1.5 GB download', cta: 'Download 1.5 GB', languages: 'About 100 languages', note: 'Slower on this Mac than Parakeet.' },
        { id: 'apple', title: 'Apple Speech', state: 'compatible', size: 'Downloaded by macOS per language', cta: 'Set up in macOS', languages: 'Languages installed in macOS', note: 'Uses the recognizer built into macOS.', platforms: ['darwin'] }
      ]
    }
  },
  { id: 'S07-knowledge', title: 'Knowledge & skills', destination: 'knowledge' },
  { id: 'S08-privacy-managed', title: 'Privacy & account with organization locks', destination: 'privacy', scrollTo: 'privacy.private-view', patch: MANAGED },
  { id: 'S09-policy-sheet', title: 'Effective policy', destination: 'privacy', patch: { ...MANAGED, sheet: 'policy' } },
  { id: 'S10-advanced', title: 'Advanced drawer', destination: 'advanced' },
  { id: 'S11-search', title: 'Search with synonyms', destination: 'general', query: 'mic' },
  {
    id: 'S12-search-empty', title: 'Search for a control hidden by policy', destination: 'general', query: 'anthropic',
    patch: {
      organization: { name: 'Mantu IT', revision: 12 },
      hidden: ['advanced.ai-provider', 'advanced.api-keys', 'advanced.custom-endpoint', 'advanced.model-overrides', 'advanced.thinking',
        'advanced.temperature', 'advanced.backup-order', 'advanced.prefer-free', 'advanced.switch-early', 'advanced.race-backup']
    }
  },
  {
    id: 'S13-save-failed', title: 'Save failed, value reverted', destination: 'voice', scrollTo: 'voice.auto-answer',
    patch: { failed: { control: 'voice.auto-answer', attempted: { autoSuggest: false }, message: 'Couldn’t save. Suggest replies automatically is still on.' } }
  },
  {
    id: 'S14-policy-changed', title: 'Policy changed during a meeting', destination: 'voice',
    patch: {
      organization: { name: 'Mantu IT', revision: 13 },
      capture: { what: 'Recording · 24 min' },
      values: { cloudSttProvider: 'unconfigured' },
      speechPacks: PARAKEET_IN_USE,
      readiness: { voice: { status: 'good', title: 'Speech is ready', detail: 'This meeting: local speech (Parakeet) on this device. From the next meeting: Cloudflare, set by Mantu IT.' } },
      locks: { cloudSttProvider: { owner: 'Mantu IT', pending: 'Cloudflare from the next meeting', reason: 'Cloud speech is now required. This meeting keeps local speech.' } },
      banners: [{ tone: 'warning', title: 'Mantu IT updated your policy (revision 13)', text: 'Speech processing changes to Cloudflare when this meeting ends. This meeting keeps local speech on this device.', actions: [{ label: 'View policy' }] }],
      policy: [{ setting: 'Speech processing', value: 'Cloudflare, from the next meeting', source: 'Locked by Mantu IT', why: 'Cloud speech is now required.' }],
      summaries: { 'privacy.org-policy': 'Mantu IT manages 1 setting on this device (policy revision 13)' }
    }
  },
  { id: 'S15-narrow', title: 'Narrow window', destination: 'voice', viewport: { width: 360, height: 720 } },
  {
    id: 'S16-migrated', title: 'First open after upgrading', destination: 'general',
    patch: {
      values: { cloudSttProvider: 'unconfigured' },
      speechPacks: PARAKEET_IN_USE,
      readiness: { voice: { status: 'good', title: 'Speech is ready', detail: 'Local speech (Parakeet) on this device.' } },
      banners: [
        { tone: 'info', title: 'Settings now live in four places', text: 'Speech is now in Voice & meetings, Brain in Knowledge & skills, and your account and connected apps in Privacy & account. Everything you chose is unchanged.', actions: [{ label: 'Show where things moved' }, { label: 'Dismiss' }] },
        { tone: 'info', title: 'Choose how speech is processed', text: 'You use local speech (Parakeet) on this device, and that stays as it is. Métis can also transcribe with Cloudflare, which sends meeting audio to Cloudflare. Nothing changes until you choose.', actions: [{ label: 'Keep local speech', primary: true }, { label: 'Review Cloudflare' }] }
      ]
    }
  },
  { id: 'S17-connected-apps', title: 'Privacy & account, connected apps', destination: 'privacy', scrollTo: 'privacy.dust' }
]
