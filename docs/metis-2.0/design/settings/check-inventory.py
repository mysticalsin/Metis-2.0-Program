#!/usr/bin/env python3
"""Check the Settings 2.0 inventory against the settings schema it classifies (M2-0101).

Static only: reads src/shared/ipc.ts from the public repository at the inventory's base commit with
`git show` and parses BaseSettingsSchema as text. It executes no repository code (D-28).

Usage: python3 check-inventory.py --repo <path to a clone of the public repository>
Exit 0 when every rule holds; exit 1 with one line per violation otherwise.

The text parse below is a stopgap for the design phase only. The public-repository check that ships
with the implementation (scripts/settings/check-inventory.mjs, M2-0117.1) replaces it and enforces the
same rules against the live zod schema.
"""
import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

CLASSES = {"KEEP", "MERGE", "ADVANCED", "OPERATOR-ONLY", "DEPRECATED", "PLATFORM-SPECIFIC"}
DESTINATIONS = ["general", "voice", "knowledge", "privacy"]
DRAWER = "advanced"
REQUIRED_SYNONYMS = ["microphone", "offline", "local", "record", "teams", "privacy", "storage"]
READ_ONLY_TYPES = {"readout", "policy-readout"}
# Writers that never go through a settings patch. M2-0062's SERVER_AUTHORITATIVE_SETTINGS_KEYS is exactly the
# settings entries whose `write` is one of them (SETTINGS-2.0.md §5, §12).
SERVER_AUTHORITATIVE_WRITERS = {"main", "server", "managed"}
EVIDENCE_LABEL = re.compile(r"\b(?:OBSERVED|DERIVED|ASSUMED)\b")
SOURCE_ANCHOR = re.compile(r"[\w./-]+\.(?:ts|tsx|swift):\d+")


def code_only(src):
    """Blank out comments, string literals and regex literals so brackets can be counted."""
    out, i, n = list(src), 0, len(src)
    # The last significant code character tells a regex literal from a division. It starts as "", which `in`
    # finds in every string, so a slash at the very start opens a regex.
    last = ""

    def blank(a, b):
        for j in range(a, b):
            if out[j] != "\n":
                out[j] = " "

    while i < n:
        ch, nxt = src[i], src[i + 1] if i + 1 < n else ""
        if ch == "/" and nxt == "/":
            end = src.find("\n", i)
            end = n if end < 0 else end
            blank(i, end)
            i = end
        elif ch == "/" and nxt == "*":
            end = src.index("*/", i + 2) + 2
            blank(i, end)
            i = end
        elif ch in "'\"`" or (ch == "/" and last in "(,=:[!&|?{};+"):
            j, in_class = i + 1, False
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if ch == "/" and src[j] == "[":
                    in_class = True
                elif ch == "/" and src[j] == "]":
                    in_class = False
                elif src[j] == ch and not in_class:
                    break
                j += 1
            blank(i + 1, j)
            last = ch
            i = j + 1
        else:
            if not ch.isspace():
                last = ch
            i += 1
    return "".join(out)


def matching_paren(src, open_index):
    depth = 0
    for i in range(open_index, len(src)):
        if src[i] in "({[":
            depth += 1
        elif src[i] in ")}]":
            depth -= 1
            if depth == 0:
                return i
    raise ValueError("unbalanced schema text")


def object_fields(body):
    """Top-level `name: expression` pairs of a z.object({...}) body."""
    fields, depth, start = {}, 0, 0
    for i, ch in enumerate(body + ","):
        if ch in "({[":
            depth += 1
        elif ch in ")}]":
            depth -= 1
        elif ch == "," and depth == 0:
            m = re.match(r"\s*([A-Za-z0-9_]+)\s*:\s*(.*)", body[start:i], flags=re.S)
            if m:
                fields[m.group(1)] = m.group(2).strip()
            start = i + 1
    return fields


def leaves(expr, prefix):
    """Leaf paths of an inline z.object expression, or [prefix] for anything else."""
    m = re.match(r"z\s*\.object\(\s*\{", expr)
    if not m:
        return [prefix]
    open_brace = expr.index("{", m.start())
    body = expr[open_brace + 1:matching_paren(expr, open_brace)]
    out = []
    for name, sub in object_fields(body).items():
        out += leaves(sub, f"{prefix}.{name}")
    return out


def schema_fields(ipc_source):
    src = code_only(ipc_source)
    anchor = src.index("export const BaseSettingsSchema = z.object(")
    open_brace = src.index("{", anchor)
    body = src[open_brace + 1:matching_paren(src, open_brace)]
    return {name: leaves(expr, name) for name, expr in object_fields(body).items()}


def problems(inventory, fields):
    out = []
    keys = [k for k in inventory["keys"] if k["store"] == "settings"]
    controls = {c["id"]: c for c in inventory["controls"]}
    groups = {(d["id"], g["id"]): g for d in inventory["destinations"] for g in d["groups"]}
    predicates = inventory.get("predicates", {})
    used_predicates = set()

    def predicate(where, field, pid):
        """Every condition a renderer evaluates is a declared predicate id, never free text."""
        used_predicates.add(pid)
        if pid not in predicates:
            out.append(f'{where}: {field} names "{pid}", which is not a declared predicate')

    dest_ids = [d["id"] for d in inventory["destinations"]]
    if dest_ids != DESTINATIONS + [DRAWER]:
        out.append(f"destinations must be exactly {DESTINATIONS} plus the {DRAWER} drawer, got {dest_ids}")

    seen = Counter(k["key"] for k in inventory["keys"])
    by_key = {k["key"]: k for k in inventory["keys"]}
    bound = {k["key"]: k["control"] for k in inventory["keys"]}
    out += [f"{key}: inventoried {n} times" for key, n in seen.items() if n > 1]

    by_top = {}
    for k in keys:
        top = re.split(r"[.\[]", k["key"], maxsplit=1)[0]
        by_top.setdefault(top, []).append(k["key"])
    # A key that a later ticket adds (`planned_by`) is the only entry allowed outside the schema, and only
    # until it lands there.
    planned = {k["key"]: k["planned_by"] for k in keys if "planned_by" in k}
    for top in by_top:
        if top in planned and top in fields:
            out.append(f"{top}: in BaseSettingsSchema, so no longer planned by {planned[top]}")
        elif top not in planned and top not in fields:
            out.append(f"{top}: inventoried but not in BaseSettingsSchema")
    for top, paths in fields.items():
        entries = set(by_top.get(top, []))
        if not entries:
            out.append(f"{top}: schema key not classified")
            continue
        facets = {e for e in entries if e.startswith(top + "[")}
        if top in entries:
            if entries - {top}:
                out.append(f"{top}: classified both as a whole and by part")
        elif facets:
            if f"{top}[*]" not in facets:
                out.append(f"{top}: record facets need a [*] entry for the remaining ids")
        else:
            missing = [p for p in paths if p not in entries]
            if missing:
                out.append(f"{top}: leaves not classified: {', '.join(missing)}")
        for path in sorted(entries - facets - set(paths) - {top}):
            out.append(f"{path}: inventoried but not in BaseSettingsSchema")

    for k in inventory["keys"]:
        key, cls, ctl_id = k["key"], k["class"], k["control"]
        if cls not in CLASSES:
            out.append(f"{key}: unknown class {cls}")
            continue
        ctl = controls.get(ctl_id) if ctl_id else None
        if ctl_id and not ctl:
            out.append(f"{key}: unknown control {ctl_id}")
            continue
        if ctl and key not in ctl["keys"]:
            out.append(f"{key}: control {ctl_id} does not list it")
        hidden = bool(ctl) and (ctl["destination"] == DRAWER or ctl.get("disclosure")
                                or groups[(ctl["destination"], ctl["group"])].get("disclosure", False))
        if cls == "KEEP" and ctl and hidden:
            out.append(f"{key}: KEEP but its control {ctl_id} sits behind a disclosure")
        if cls == "MERGE" and (not ctl or len(ctl["keys"]) < 2):
            out.append(f"{key}: MERGE needs a control shared with other keys")
        if cls == "ADVANCED" and (not ctl or not hidden):
            out.append(f"{key}: ADVANCED needs a control behind a disclosure")
        if cls == "DEPRECATED" and (ctl or k["migration"] == "none"):
            out.append(f"{key}: DEPRECATED needs no control and a migration rule")
        sheet = k.get("policy_sheet", {})
        if cls == "DEPRECATED" and k["store"] == "settings" and not (
                sheet.get("text") and isinstance(sheet.get("show_value"), bool)):
            out.append(f"{key}: DEPRECATED settings entry needs policy_sheet text and show_value for the policy sheet")
        recovery_path = bool(ctl and ctl.get("recovery_path"))
        if cls == "OPERATOR-ONLY" and ctl and ctl["type"] not in READ_ONLY_TYPES and not recovery_path:
            out.append(f"{key}: OPERATOR-ONLY control {ctl_id} must be read-only or a recovery path")
        if (k["store"] == "settings" and cls in {"OPERATOR-ONLY", "DEPRECATED"} and not recovery_path
                and k["write"] not in SERVER_AUTHORITATIVE_WRITERS):
            out.append(f"{key}: {cls} settings entry written by {k['write']}; only main, the server or managed "
                       "configuration may write it")
        if cls == "PLATFORM-SPECIFIC" and not (ctl and ctl["platforms"] != ["darwin", "win32"]) and "platforms" not in k:
            out.append(f"{key}: PLATFORM-SPECIFIC needs a platform restriction")
        if not (EVIDENCE_LABEL.search(k["basis"]) and SOURCE_ANCHOR.search(k["basis"])):
            out.append(f"{key}: basis needs an evidence label (OBSERVED, DERIVED or ASSUMED) and a file:line anchor")

    for ctl in inventory["controls"]:
        for key in ctl["keys"]:
            if key not in bound:
                out.append(f"{ctl['id']}: lists {key}, which has no inventory entry")
            elif bound[key] != ctl["id"]:
                out.append(f"{ctl['id']}: lists {key}, which the inventory binds to {bound[key] or 'no control'}")
        if (ctl["destination"], ctl["group"]) not in groups:
            out.append(f"{ctl['id']}: unknown group {ctl['destination']}.{ctl['group']}")
            continue
        if not ctl["synonyms"]:
            out.append(f"{ctl['id']}: no search synonyms")
        for field in ("visible_when", "read_only_when"):
            if field in ctl:
                predicate(ctl["id"], field, ctl[field])
        if ctl.get("recovery_path") and not ctl.get("visible_when"):
            out.append(f"{ctl['id']}: a recovery path needs the visible_when condition that opens it")
        # A settings patch never carries a server-authoritative key, so a control that changes one must name
        # the main handler it calls: an existing one by its anchor, a missing one by the ticket that adds it.
        via_main = [key for key in ctl["keys"] if by_key.get(key, {}).get("store") == "settings"
                    and by_key[key]["write"] in SERVER_AUTHORITATIVE_WRITERS]
        handlers = ctl.get("handlers", [])
        if via_main and ctl["type"] not in READ_ONLY_TYPES and not (handlers and all(
                SOURCE_ANCHOR.fullmatch(h.get("anchor", "")) or h.get("planned_by") for h in handlers)):
            out.append(f"{ctl['id']}: writes {', '.join(via_main)} through main, so it needs handlers, "
                       "each with a file:line anchor or planned_by")
        # An option has two preconditions, each a predicate id with the reason shown while it fails.
        # `offered_when`: the option may be chosen; one not offered is hidden, except the option in force,
        # which is always shown with `not_offered.reason`. `requires`: the option can take effect; choosing
        # it while it fails opens `unavailable.opens` if given and otherwise shows `unavailable.reason`.
        for option in ctl.get("options", []):
            where = f"{ctl['id']}: option {option.get('value', option.get('key'))}"
            if "visible_when" in option:
                out.append(f"{where}: an option is offered through offered_when, never visible_when")
            for test, outcome in (("offered_when", "not_offered"), ("requires", "unavailable")):
                if test in option:
                    predicate(where, test, option[test])
                if (test in option) != (outcome in option) or (outcome in option and not option[outcome].get("reason")):
                    out.append(f"{where}: {test} and {outcome}.reason go together")
            opens = option.get("unavailable", {}).get("opens")
            if opens and opens not in controls:
                out.append(f"{where}: unavailable.opens names {opens}, which is not a control")
        if ctl["destination"] == "privacy" and (ctl.get("disclosure") or groups[("privacy", ctl["group"])].get("disclosure")):
            out.append(f"{ctl['id']}: privacy controls are never behind a disclosure")
    for pid, definition in predicates.items():
        if pid not in used_predicates:
            out.append(f'predicates: "{pid}" is declared but no control or option uses it')
        if not definition.strip():
            out.append(f'predicates: "{pid}" has no definition')
    stop = controls.get("voice.stop-capture")
    if not stop or stop.get("disclosure"):
        out.append("voice.stop-capture: Stop all capture must exist outside any disclosure")

    words = {c["id"]: " ".join([c["label"], *c["synonyms"]]).lower() for c in inventory["controls"]}
    for term in REQUIRED_SYNONYMS:
        if not any(term in text for text in words.values()):
            out.append(f"search: no control answers '{term}'")
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", required=True, help="path to a clone of the public repository")
    parser.add_argument("--inventory", default=str(Path(__file__).with_name("inventory.json")))
    args = parser.parse_args()
    inventory = json.loads(Path(args.inventory).read_text())
    ipc = subprocess.run(["git", "-C", args.repo, "show", f"{inventory['base_commit']}:src/shared/ipc.ts"],
                         check=True, capture_output=True, text=True).stdout
    fields = schema_fields(ipc)
    found = problems(inventory, fields)
    settings_keys = [k for k in inventory["keys"] if k["store"] == "settings"]
    print(f"base {inventory['base_commit'][:12]}: {len(fields)} schema keys, "
          f"{sum(len(v) for v in fields.values())} leaf paths; {len(settings_keys)} settings entries "
          f"({sum('planned_by' in k for k in settings_keys)} planned), "
          f"{len(inventory['keys']) - len(settings_keys)} non-schema entries, {len(inventory['controls'])} controls, "
          f"{len(inventory.get('predicates', {}))} predicates")
    print("classes:", ", ".join(f"{c} {n}" for c, n in sorted(Counter(k["class"] for k in inventory["keys"]).items())))
    print("controls per destination:",
          ", ".join(f"{d} {n}" for d, n in Counter(c["destination"] for c in inventory["controls"]).items()))
    print("server-authoritative settings entries (M2-0062):",
          sum(k["write"] in SERVER_AUTHORITATIVE_WRITERS for k in settings_keys))
    for line in found:
        print("FAIL", line)
    print("PASS" if not found else f"{len(found)} problem(s)")
    return 0 if not found else 1


if __name__ == "__main__":
    sys.exit(main())
