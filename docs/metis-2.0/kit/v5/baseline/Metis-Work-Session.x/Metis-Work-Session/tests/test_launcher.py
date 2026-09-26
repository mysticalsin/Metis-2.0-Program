import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("metis_launcher",HERE/"start_metis_work.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home=Path(self.temp.name)
        self.workspace=self.home/"workspace with spaces"
        self.repo=self.workspace/"repo"
        self.repo.mkdir(parents=True)
        def git(*args):
            return subprocess.run(["git","-C",str(self.repo),*args],check=True,
                                  text=True,capture_output=True).stdout.strip()
        self.git=git
        git("init","-q")
        git("config","user.name","Local fixture")
        git("config","user.email","fixture@example.invalid")
        (self.repo/"source.txt").write_text("baseline")
        git("add","source.txt")
        git("commit","-qm","fixture baseline")
        git("remote","add","origin","https://github.com/mysticalsin/AskToto-Mantu.git")

    def test_origin_accepts_expected_https(self):
        self.assertTrue(m.trusted_origin("https://github.com/mysticalsin/AskToto-Mantu.git"))

    def test_origin_accepts_expected_ssh(self):
        self.assertTrue(m.trusted_origin("git@github.com:mysticalsin/AskToto-Mantu.git"))

    def test_token_origin_is_rejected(self):
        self.assertFalse(m.trusted_origin("https://token@github.com/mysticalsin/AskToto-Mantu.git"))

    def test_lookalike_origin_is_rejected(self):
        self.assertFalse(m.trusted_origin("https://github.com.evil.invalid/mysticalsin/AskToto-Mantu.git"))

    def test_dirty_user_work_is_not_reset(self):
        (self.repo/"source.txt").write_text("Tony's unsaved edit")
        facts=m.inspect_repo(self.repo)
        self.assertEqual(facts["changed_paths"],"1")
        self.assertEqual((self.repo/"source.txt").read_text(),"Tony's unsaved edit")

    def test_staged_user_work_is_preserved(self):
        (self.repo/"source.txt").write_text("staged change")
        self.git("add","source.txt")
        m.inspect_repo(self.repo)
        self.assertEqual(self.git("diff","--cached","--name-only"),"source.txt")

    def test_wrong_origin_stops(self):
        self.git("remote","set-url","origin","https://github.com/someone/else.git")
        with self.assertRaises(m.Stop):
            m.inspect_repo(self.repo)

    def test_different_push_origin_stops(self):
        self.git("remote","set-url","--push","origin","https://github.com/someone/else.git")
        with self.assertRaises(m.Stop):
            m.inspect_repo(self.repo)

    def test_missing_checkout_not_created(self):
        absent=self.home/"not-there"
        with self.assertRaises(m.Stop):
            m.inspect_repo(absent)
        self.assertFalse(absent.exists())

    def test_subdirectory_cannot_masquerade_as_repo(self):
        sub=self.repo/"nested";sub.mkdir()
        with self.assertRaises(m.Stop):
            m.inspect_repo(sub)

    def test_codex_command_uses_explicit_normal_approval_and_workspace_sandbox(self):
        result=m.agent_command("codex","/fixture/codex",self.repo,"read the job",
                               "--sandbox --ask-for-approval --cd")
        self.assertEqual(result,["/fixture/codex","--sandbox","workspace-write",
                                "--ask-for-approval","on-request","--cd",str(self.repo),"read the job"])

    def test_claude_command_uses_default_approval(self):
        self.assertEqual(m.agent_command("claude","/fixture/claude",self.repo,"job","--permission-mode"),
                         ["/fixture/claude","--permission-mode","default","job"])

    def test_unknown_cli_flags_stop_instead_of_dropping_security_controls(self):
        with self.assertRaises(m.Stop):
            m.agent_command("codex","codex",self.repo,"job","old unsupported CLI")

    def test_explicit_agent_path_is_not_a_shell_expression(self):
        target=self.home/"agent ; echo injected"
        target.write_text("#!/bin/sh\nexit 0\n")
        target.chmod(0o700)
        self.assertEqual(m.find_agent("codex",str(target)),("codex",str(target)))

    def test_explicit_agent_requires_a_type(self):
        with self.assertRaises(m.Stop):
            m.find_agent("auto","/bin/echo")

    def test_codex_preferred_over_claude_when_both_detected(self):
        with patch.object(m.shutil,"which",side_effect=lambda name:f"/fixture/{name}"):
            self.assertEqual(m.find_agent("auto",None),("codex","/fixture/codex"))

    def test_reuses_bridge_lock_and_excludes_another_writer(self):
        with m.foreground_lock(self.workspace):
            with self.assertRaises(m.Stop):
                with m.foreground_lock(self.workspace):
                    self.fail("second writer")
        with m.foreground_lock(self.workspace):
            pass

    def test_symlink_lock_is_rejected(self):
        target=self.home/"other";target.write_text("unchanged")
        (self.workspace/".metis-bridge.lock").symlink_to(target)
        with self.assertRaises((OSError,m.Stop)):
            with m.foreground_lock(self.workspace):
                pass
        self.assertEqual(target.read_text(),"unchanged")

    def test_nonprivate_lock_not_silently_chmodded(self):
        lock=self.workspace/".metis-bridge.lock"
        lock.write_text("");lock.chmod(0o644)
        with self.assertRaises(m.Stop):
            with m.foreground_lock(self.workspace):
                pass
        self.assertEqual(lock.stat().st_mode&0o777,0o644)

    def test_checksum_detects_tampering(self):
        f=self.home/"file.txt";f.write_text("original")
        manifest={"files":{"file.txt":hashlib.sha256(f.read_bytes()).hexdigest()}}
        (self.home/"CONTENT-SHA256.json").write_text(json.dumps(manifest))
        m.verify_bundle(self.home)
        f.write_text("changed")
        with self.assertRaises(m.Stop):
            m.verify_bundle(self.home)

    def test_checksum_rejects_parent_escape(self):
        (self.home/"CONTENT-SHA256.json").write_text(json.dumps({"files":{"../escape":"anything"}}))
        with self.assertRaises(m.Stop):
            m.verify_bundle(self.home)

    def test_check_does_not_spawn_the_agent_or_change_source(self):
        original=m.output
        with patch.object(m,"verify_bundle"), patch.object(m,"find_agent",return_value=("codex","/fixture/codex")), \
             patch.object(m,"output",wraps=m.output) as output_mock, \
             contextlib.redirect_stdout(io.StringIO()):
            output_mock.side_effect=lambda args,cwd=None: (
                "--sandbox --ask-for-approval --cd" if args[0]=="/fixture/codex" else original(args,cwd))
            self.assertEqual(m.main(["--workspace",str(self.workspace),"--check"]),0)
            self.assertEqual((self.repo/"source.txt").read_text(),"baseline")
            self.assertFalse((self.workspace/".metis-bridge.lock").exists())

    def test_noninteractive_execution_stops_before_spawning(self):
        with patch.object(m,"verify_bundle"), patch.object(m,"inspect_repo",return_value={
            "root":str(self.repo),"head":"a"*40,"changed_paths":"1"}), \
             patch.object(m,"find_agent",return_value=("codex","/fixture/codex")), \
             patch.object(m,"output",return_value="--sandbox --ask-for-approval --cd"), \
             patch.object(m.sys.stdin,"isatty",return_value=False), \
             patch.object(m.subprocess,"run") as runner, contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(m.Stop):
                m.main(["--workspace",str(self.workspace)])
            runner.assert_not_called()

    def test_foreground_agent_receives_terminal_without_shell_or_transcript_capture(self):
        with patch.object(m,"verify_bundle"), patch.object(m,"inspect_repo",return_value={
            "root":str(self.repo),"head":"a"*40,"changed_paths":"1"}), \
             patch.object(m,"find_agent",return_value=("codex","/fixture/codex")), \
             patch.object(m,"output",return_value="--sandbox --ask-for-approval --cd"), \
             patch.object(m.sys.stdin,"isatty",return_value=True), \
             patch.object(m.sys.stdout,"isatty",return_value=True), \
             patch.object(m.subprocess,"run",return_value=subprocess.CompletedProcess([],0)) as runner, \
             contextlib.redirect_stdout(io.StringIO()) as stream:
            # redirect_stdout replaces stdout, so this scoped stream must report TTY too.
            with patch.object(stream,"isatty",return_value=True):
                self.assertEqual(m.main(["--workspace",str(self.workspace)]),0)
            args,kw=runner.call_args
            self.assertEqual(args[0][0],"/fixture/codex")
            self.assertEqual(kw,{"cwd":self.repo,"check":False})
            self.assertIn("LOCAL-AGENT-INSTRUCTIONS.md",args[0][-1])

if __name__=="__main__":
    unittest.main(verbosity=2)
