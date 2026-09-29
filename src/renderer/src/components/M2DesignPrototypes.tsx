type PrototypeSpec = {
  ticket: string
  title: string
  kit: string[]
  keyboard: string
  states: string[]
  primary: string
  evidence: string
}

const PROTOTYPES: PrototypeSpec[] = [
  {
    ticket: 'M2-0093',
    title: 'ARMED orb, expanded pill, caption, beam and voice glow',
    kit: ['TASK-030', 'M2-UX-01', 'EXP-10', 'SRC-14'],
    keyboard: 'Tab to orb, Enter opens typing, Escape collapses',
    states: ['ARMED', 'Typing', 'Trusted wake', 'Approval', 'Reduced motion'],
    primary: 'One solving orb holds rest; the pill opens only after an explicit key path.',
    evidence: 'Caption and beam appear only in trusted wake, with a static stepped level in reduced motion.'
  },
  {
    ticket: 'M2-0094',
    title: 'Unified task card with receipt-driven progress',
    kit: ['CXSTEP-08', 'CXCAP-24', 'MB-10', 'MB-13', 'MB-19', 'MB-22', 'EXP-04'],
    keyboard: 'Tab enters receipt card, Enter opens receipt detail, Escape returns',
    states: ['Queued', 'Running', 'Needs input', 'Receipt complete', 'Failed receipt', 'Reduced motion'],
    primary: 'Progress is driven by receipt rows, not a decorative spinner.',
    evidence: 'Every state keeps source, timestamp and next action visible.'
  },
  {
    ticket: 'M2-0100',
    title: 'Named orbs and compact Agent Home',
    kit: ['AGSTEP-07', 'AGX-15', 'AGUC-029', 'AGUC-030'],
    keyboard: 'Cmd/Ctrl+K opens Agent Home, arrows move agent focus, Enter selects',
    states: ['Compact home', 'Agent focused', 'Busy named orb', 'Handoff', 'Reduced motion'],
    primary: 'Named orbs show owned work and handoff status without turning into a dashboard.',
    evidence: 'Agent labels remain visible at 1x and do not rely on color alone.'
  },
  {
    ticket: 'M2-0114',
    title: 'Live-meeting quiet assistance, capture truth and recap',
    kit: ['EXP-01', 'EXP-03', 'EXP-07', 'CXSTEP-17', 'FLOW-04'],
    keyboard: 'Cmd/Ctrl+L focuses assist, Cmd/Ctrl+R opens recap, Escape returns',
    states: ['Quiet assist', 'Capture truthful', 'Recovery', 'During-meeting recap', 'Long meeting', 'Reduced motion'],
    primary: 'Capture status is explicit: recording, paused and missing audio are separate states.',
    evidence: 'Recap lists current decisions, questions and evidence while the meeting is still live.'
  },
  {
    ticket: 'M2-0117',
    title: 'Four-destination Settings UI',
    kit: ['TASK-022', 'M2-LOCAL-01', 'UC-097', 'UC-098', 'UC-099', 'M2-SET-01', 'M2-SET-02'],
    keyboard: 'Cmd/Ctrl+, opens settings, Tab moves destinations, Enter opens panel',
    states: ['Destinations', 'Local AI', 'Permissions', 'Account', 'Diagnostics', 'Reduced motion'],
    primary: 'Four destinations stay visible while detailed provider state changes.',
    evidence: 'No destination depends on hover; focus ring and selected destination are distinct.'
  },
  {
    ticket: 'M2-0130',
    title: 'Evidence-first Intelligence workspace',
    kit: ['TASK-040', 'UC-041', 'UC-042', 'UC-043', 'UC-044', 'UC-045', 'UC-046', 'UC-047', 'UC-048', 'M2-KNOW-01'],
    keyboard: 'Cmd/Ctrl+I opens Intelligence, arrows move evidence graph, Enter opens source',
    states: ['Evidence graph', 'Source preview', 'Conflict', 'Outdated evidence', 'Export', 'Reduced motion'],
    primary: 'Every insight is attached to its source, confidence and freshness.',
    evidence: 'Conflicts are first-class rows, not hidden warnings.'
  },
  {
    ticket: 'M2-0137',
    title: 'Memory UX approve/forget, isolation and outage states',
    kit: ['HMSTEP-08', 'HMSTEP-11', 'HSAC-01', 'HSAC-03', 'HSAC-15', 'HSAC-16'],
    keyboard: 'Tab moves suggestions, A approves, F forgets, Escape closes',
    states: ['Approve', 'Forget', 'Tenant isolated', 'Outage', 'Undo', 'Reduced motion'],
    primary: 'Memory writes are explicit approvals with a reversible local action.',
    evidence: 'Isolation and outage states are visible before any action is allowed.'
  },
  {
    ticket: 'M2-0158',
    title: 'Portal surfaces and data health',
    kit: ['TASK-045', 'TASK-045.CORE', 'UC-052', 'UC-054', 'UC-055', 'M2-OPS-01', 'M2-OPS-02'],
    keyboard: 'Cmd/Ctrl+P opens portal, Tab reaches health filters, Enter drills in',
    states: ['Portal overview', 'Data health', 'Connector warning', 'Sync detail', 'Admin export', 'Reduced motion'],
    primary: 'Health is shown per connector, per tenant and per sync age.',
    evidence: 'Warnings include owner, affected surface and safe next step.'
  },
  {
    ticket: 'M2-0160',
    title: 'Onboarding repair flows and welcome slot',
    kit: ['TASK-027.B', 'OBU-01', 'OBU-02', 'OBU-03', 'OBU-04', 'OBU-05'],
    keyboard: 'Tab progresses welcome, Enter repairs selected gate, Escape pauses onboarding',
    states: ['Welcome slot', 'Permission repair', 'Model repair', 'Account repair', 'Resume', 'Reduced motion'],
    primary: 'Repair flows resume in place and preserve the welcome slot.',
    evidence: 'Each repair state names the missing gate and the safe recovery path.'
  }
]

function Orb({ reduced }: { reduced?: boolean }): JSX.Element {
  return (
    <div className={`m2-orb${reduced ? ' m2-orb-reduced' : ''}`} aria-hidden="true">
      <span />
    </div>
  )
}

function PrototypePanel({ spec, mode, scale, reduced = false }: { spec: PrototypeSpec; mode: 'light' | 'dark'; scale: '1x' | '2x'; reduced?: boolean }): JSX.Element {
  const variant = reduced ? 'reduced-motion' : `${mode}-${scale}`

  return (
    <section className={`m2-panel ${mode} scale-${scale}`} data-ticket={spec.ticket} data-variant={variant}>
      <header>
        <Orb reduced={reduced} />
        <div>
          <p className="m2-ticket">{spec.ticket}</p>
          <h2>{spec.title}</h2>
        </div>
      </header>
      <p className="m2-primary">{spec.primary}</p>
      <div className="m2-states" aria-label={`${spec.ticket} state list`}>
        {spec.states.map((state) => (
          <span key={state}>{state}</span>
        ))}
      </div>
      <dl>
        <div>
          <dt>Keyboard</dt>
          <dd>{spec.keyboard}</dd>
        </div>
        <div>
          <dt>Kit</dt>
          <dd>{spec.kit.join(', ')}</dd>
        </div>
        <div>
          <dt>Evidence rule</dt>
          <dd>{spec.evidence}</dd>
        </div>
      </dl>
    </section>
  )
}

export function M2DesignPrototypes(): JSX.Element {
  return (
    <main className="m2-design-prototypes" data-surface="M2-0201">
      <header className="m2-hero">
        <p>M2-0201 DESIGNED renderer prototypes</p>
        <h1>Metis 2.0 W3 surfaces</h1>
      </header>
      {PROTOTYPES.map((spec) => (
        <article className="m2-matrix" key={spec.ticket} id={spec.ticket}>
          <div className="m2-matrix-title">
            <p>{spec.ticket}</p>
            <h2>{spec.title}</h2>
          </div>
          <PrototypePanel spec={spec} mode="light" scale="1x" />
          <PrototypePanel spec={spec} mode="dark" scale="1x" />
          <PrototypePanel spec={spec} mode="light" scale="2x" />
          <PrototypePanel spec={spec} mode="dark" scale="2x" />
          <PrototypePanel spec={spec} mode="light" scale="1x" reduced />
        </article>
      ))}
    </main>
  )
}

export { PROTOTYPES }
