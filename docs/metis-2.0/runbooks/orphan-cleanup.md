# Runbook: one-off cleanup of orphaned `llama-server` processes (M2-0010)

Program document — private. Never copy this file, or its command output, into the public
`AskToto-Mantu` repository.

**Owner-run only. The agent that wrote this runbook does not execute any of it and does not kill any
process.** Every command below is either read-only or targets an exact PID you have just verified
yourself. Run everything as your normal macOS user — never with `sudo`.

## 1. Why this exists

Two `llama-server` processes are currently resident on this Mac with `ppid=1` (reparented to
`launchd`, i.e. their parent already died), each holding about 3.1 GB of `phys_footprint` — not
`rss`. If you separately check RSS for the same process (for example with `ps -o rss` or Activity
Monitor) you will see something like 8 MB; that is expected, not a contradiction. `phys_footprint`
and `rss` account for shared and compressed memory differently, and neither figure is what decides
which processes to act on below — the identity check in step 4 (exe path, model-path argument, ppid)
is (OBSERVED: `metis-v2-review/verify/RUNTIME-EVIDENCE.md` "Processes" section, PIDs 5489 and 8347;
`phys_footprint` measured there with the read-only `footprint <PID>` command, e.g. `footprint 5489`).
They exist because before Métis 1.9.7, nothing reaps a sidecar on a hard kill or crash: every cleanup
path (`will-quit`, the emergency-quit hotkey) only runs if the JS event loop is still alive, and
`child_process.spawn` never links a child's life to its parent on macOS — a force-quit or crash
simply orphans the running model server (DERIVED: `metis-v2-review/lanes/B2-resource-heavy.md`
finding F1, and `metis-v2-review/lanes/B3-crash-stability.md` §193-197). They will not go away on
their own before a reboot.

The identity rule used below — exact executable path under the installed bundle, the exact `-m
<userData>/local-llm/` model-path argument, and `ppid == 1` — is not improvised for this runbook. The
target architecture's "legacy net" rule for reaping pre-1.9.7 orphans automatically once M2-0027 ships
checks exe realpath, the same model-path argument, `ppid == 1`, and that the process started before
the current main (`docs/metis-2.0/ARCHITECTURE.md` §2.4, "Legacy net" paragraph). This runbook checks
the first three directly; the fourth is covered by the third here — a process only gets `ppid == 1`
once its original parent has exited, so it necessarily started under an earlier session than whatever
main is (or isn't) running now. This runbook applies that same rule, by hand, once, today.

**This is a one-off relief measure, not a fix.** Until M2-0027/M2-0028 land in 1.9.7, a future
force-quit or crash will orphan a new `llama-server` the same way. Re-run this runbook again if that
happens; there is no need to wait for a new ticket.

## 2. Rules (non-negotiable)

- Kill **only** a PID that, right before you kill it, still matches **all three** conditions in
  step 4: exe path under `/Applications/Metis.app`, the exact `-m <userData>/local-llm/` argument, and
  `ppid == 1`.
- **Never** `pkill`/`killall` by the name `llama-server` — always target one exact numeric PID with
  `kill`.
- **Never** run or target `/usr/bin/fm` — it is an unrelated system binary that other tools may
  legitimately be running; the identity rule above will never match it, and neither should you by
  hand.
- **Never** kill the running Métis app itself, its Renderer/Helper processes, or a
  `chrome_crashpad_handler` process. Orphaned crash-handler processes were also observed
  (`RUNTIME-EVIDENCE.md`, PIDs 1477/8081) but are out of scope for this runbook — it covers
  `llama-server` only, per the ticket.
- If a candidate PID's command line does not contain **both** `/Applications/Metis.app` and
  `local-llm/` when you look at it yourself, stop and do not kill it — the filters below are a
  convenience, not a substitute for reading the line.

## 3. Before census (paste this into the ticket)

Run the ticket's own verification command, widened so long paths aren't truncated:

```bash
ps -axwwo pid,ppid,pgid,lstart,command | grep -F 'llama-server'
```

Copy the full output. This is your "before" record. Note: this `grep` command's own process line will
usually appear in the output too, because it is itself running at the moment `ps` takes its snapshot
and its own argument list contains the literal text `llama-server` — that line is `grep`, not a
survivor; do not count it.

If Métis is currently running, also note its main process PID so you have it as a reference for
step 4 (skip this if Métis is fully quit):

```bash
ps -axwwo pid,ppid,command | awk '$3 == "/Applications/Metis.app/Contents/MacOS/Metis" { print }'
```

This matches only the exact main-app executable path as the first token (`argv[0]`) of the command,
so it never picks up a Helper process, and — unlike a `grep` for the same path — never picks up its
own process line either (an `awk` invocation's own command starts with `awk`, not the Métis path).

## 4. Find the exact candidates to kill

```bash
USERDATA="$HOME/Library/Application Support/asktoto"
BUNDLE_LLAMA="/Applications/Metis.app/Contents/Resources/llama/mac/arm64/llama-server"

ps -axwwo pid,ppid,command | awk -v exe="$BUNDLE_LLAMA" -v arg=" -m $USERDATA/local-llm/" '
  $2 == 1 && $3 == exe && index($0, arg) > 0 { print }
'
```

This prints only lines where **all three** hold at once: the command's first token (`$3`, i.e.
`argv[0]`) is exactly this Mac's installed Métis bundle's `llama-server` executable — not merely a
line that happens to contain that path as a substring somewhere — the command contains the exact `-m
<userData>/local-llm/` model-path argument, and `ppid` (`$2`) is `1`. Read every printed line yourself
before continuing — column 1 is the PID you will act on.

If step 3's second command found a running Métis main PID, confirm it does **not** appear as the
`ppid` of any line above (it structurally can't — `ppid=1` is `launchd`, never a live app — but look
anyway; this is the "parent is not the running Métis" check).

**Immediately before step 5, re-run this exact command again** and kill only the PIDs it prints on
that second run. Rule §2 requires a PID to still match right before you kill it — a PID that matched
when you first looked but isn't printed now no longer qualifies, and you must not kill it from memory
of the first run.

**If this command prints nothing** while step 3's first command still shows `ppid=1` `llama-server`
lines, stop. Do not loosen the filter by hand to make something match — that defeats the identity
check. Instead, give the step 3 "before" census to the lead session so the mismatch can be
investigated (the installed bundle's path or CPU architecture may differ from what this runbook
assumes).

## 5. Kill exactly those PIDs

For each PID printed by step 4's immediately-preceding re-run — one at a time, no loop, no glob:

```bash
kill -9 <PID>
```

Do not add, remove, or guess a PID that step 4 did not print.

## 6. After census (paste this into the ticket too)

```bash
ps -axwwo pid,ppid,pgid,lstart,command | grep -F 'llama-server'
```

As in step 3, this `grep` command's own process line will usually appear in the output — ignore it.

Confirm the PIDs from step 5 are gone, and, if Métis is running, confirm its main PID from step 3 is
still present and unaffected.

## 7. Record the result

Paste the before and after blocks from steps 3 and 6 into the M2-0010 entry (hand them to the lead
session to record in `docs/metis-2.0/ledger/tickets.json`, or add them yourself if you have write
access to this repo). This is the acceptance evidence the ticket needs and clears blocker `B-01` in
`docs/metis-2.0/BLOCKERS.md`.

## 8. Optional relief step: stop OneDrive reads from stalling the app

Separately from the process kill above, and requiring no terminal use, in Finder:

1. Open the `OneDrive-MantuGroup` location (for example, click it in the Finder sidebar, or open
   `~/Library/CloudStorage/OneDrive-MantuGroup`).
2. Find **"Métis Meetings"** in that window and right-click it there — do not open it first; you
   cannot select a folder in Finder once you have already navigated into it. Choose **"Always keep
   on this device."**
3. Now open the "Métis Meetings" folder. Its `.brain` subfolder is hidden by default; press
   **Cmd+Shift+.** to show hidden items in this Finder window.
4. Confirm `.brain` shows the same "always available" state as the rest of the folder. If it does
   not, right-click `.brain` itself and choose **"Always keep on this device"** too.

Why: a first-hand spindump of a Métis freeze — an 85.55 s "Slow response to HID event" report,
68 samples — shows the main thread's JS timer loop performing synchronous file reads that repeatedly
wait inside `apfs_materialize_dataless_file_ext`: about 50 of the 68 samples land there, in repeated
bursts, not one continuous 85-second read. Each burst is a main-thread read hitting a cloud-only
("dataless") OneDrive file and blocking until it downloads, which is what stalls the tray and hotkeys
along with everything else on the main thread (OBSERVED:
`metis-v2-review/verify/RUNTIME-EVIDENCE.md` "Freeze root cause" section). Forcing local presence on
these files should stop reads from hitting dataless placeholders (ASSUMED effective — not verified
against a live freeze in this review). It hydrates the ~59 files current at the time of that census;
of those, 6 fail to hydrate with `ETIMEDOUT` and are a separate OneDrive-side repair already tracked
in M2-0012, not something this step or ticket can fix.

## 9. What this does and does not do

Does: frees the ~3.1 GB of `phys_footprint` held by each of today's two specific orphaned
`llama-server` processes, right now, without touching the running app.

Does not: prevent the next orphan. That requires the registry-and-reaper and the process-supervisor
work at M2-0027/M2-0028 (`ARCHITECTURE.md` §2.4), which ships in 1.9.7. Until then, treat a recurrence
as expected and re-run this runbook rather than waiting on a new ticket.
