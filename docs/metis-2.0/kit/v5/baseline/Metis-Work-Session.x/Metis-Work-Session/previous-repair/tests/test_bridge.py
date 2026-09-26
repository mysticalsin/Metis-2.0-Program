"""Runner contract tests with explicit subprocess fakes; NOT GitHub authentication or live CI."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bridge', ROOT / 'metis_continue.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.workspace = self.home / 'fresh'

    def test_bundled_patch_integrity(self):
        manifest = b.bundle_check()
        self.assertEqual(manifest['base_commit'], b.BASE)
        self.assertEqual(len(manifest['files']), 16)

    def test_prepare_preserves_existing_workspace(self):
        self.workspace.mkdir()
        kept = self.workspace / 'keep.txt'; kept.write_text('important')
        with patch.object(b, 'auth_check') as auth:
            with self.assertRaisesRegex(b.Blocked, 'NEW workspace'):
                b.prepare(self.workspace)
            auth.assert_not_called()
        self.assertEqual(kept.read_text(), 'important')

    def test_prepare_refuses_nested_workspace_before_auth(self):
        with patch.object(b, 'auth_check') as auth:
            with self.assertRaisesRegex(b.Blocked, 'non-nested'):
                b.prepare(ROOT / 'not-created')
            auth.assert_not_called()

    def test_auth_refusal_never_creates_clone(self):
        with patch.object(b, 'auth_check', side_effect=b.Blocked('403')), patch.object(b, 'run') as run:
            with self.assertRaisesRegex(b.Blocked, '403'): b.prepare(self.workspace)
            run.assert_not_called()
        self.assertFalse(self.workspace.exists())

    def test_source_drift_never_creates_clone(self):
        with patch.object(b, 'auth_check'), patch.object(b, 'gh_api', return_value='f'*40):
            with self.assertRaisesRegex(b.Blocked, 'moved'): b.prepare(self.workspace)
        self.assertFalse(self.workspace.exists())

    def test_exact_remote_base_is_accepted(self):
        with patch.object(b, 'gh_api', return_value=b.BASE): b.remote_base_check()

    def test_account_read_permission_is_not_accepted_as_push(self):
        with patch.object(b, 'run'), patch.object(b, 'gh_api', return_value='false'):
            with self.assertRaisesRegex(b.Blocked, 'push permission'): b.auth_check()

    def test_missing_cli_is_actionable(self):
        with patch.object(b.shutil, 'which', return_value=None):
            with self.assertRaisesRegex(b.Blocked, 'missing: gh'): b.run('gh', 'auth', 'status')

    def test_raw_subprocess_secret_is_not_echoed(self):
        class Result:
            returncode = 1
            stderr = 'Bearer ghp_TEST_TOKEN_MUST_NOT_BE_ECHOED'
            stdout = ''
        with patch.object(b.shutil, 'which', return_value='/usr/bin/gh'), patch.object(b.subprocess, 'run', return_value=Result()):
            with self.assertRaises(b.Blocked) as caught: b.run('gh', 'auth', 'status')
        self.assertNotIn('ghp_', str(caught.exception))

    def test_run_is_not_shell_and_clears_git_routing(self):
        class Result:
            returncode = 0
            stdout = 'ok\n'
        with patch.dict(b.os.environ, {'GIT_DIR':'/wrong', 'GIT_INDEX_FILE':'/wrong-index'}), patch.object(b.shutil, 'which', return_value='/usr/bin/git'), patch.object(b.subprocess, 'run', return_value=Result()) as proc:
            self.assertEqual(b.run('git', 'status'), 'ok')
            kw = proc.call_args.kwargs
            self.assertFalse(kw.get('shell', False))
            self.assertNotIn('GIT_DIR', kw['env'])
            self.assertNotIn('GIT_INDEX_FILE', kw['env'])
            self.assertEqual(kw['env']['GIT_TERMINAL_PROMPT'], '0')

    def test_prepare_uses_new_branch_and_guarded_applicator_no_push(self):
        calls=[]
        def fake_run(*args, **kw):
            calls.append(args)
            if 'clone' in args: (self.workspace/'repo').mkdir()
            return ''
        def fake_git(repo,*args):
            calls.append(('git',*args))
            return b.BASE if args == ('rev-parse','HEAD') else ''
        with patch.object(b,'auth_check'),patch.object(b,'remote_base_check'),patch.object(b,'run',side_effect=fake_run),patch.object(b,'git',side_effect=fake_git),patch.object(b,'source_check'):
            b.prepare(self.workspace)
        self.assertTrue((self.workspace/'session.json').is_file())
        self.assertTrue(any('--check' in c for c in calls))
        self.assertTrue(any('--apply' in c for c in calls))
        self.assertFalse(any('push' in c or 'commit' in c for c in calls))
        self.assertTrue(any('--config' in c and 'core.autocrlf=false' in c for c in calls))

    def test_clone_race_does_not_apply_patch(self):
        calls=[]
        with patch.object(b,'auth_check'),patch.object(b,'remote_base_check'),patch.object(b,'run',side_effect=lambda *args,**kw:calls.append(args) or ''),patch.object(b,'git',return_value='f'*40):
            with self.assertRaisesRegex(b.Blocked,'while cloning'): b.prepare(self.workspace)
        self.assertFalse(any('--apply' in c for c in calls))

    def test_changed_bundle_state_is_rejected(self):
        self.workspace.mkdir()
        (self.workspace/'session.json').write_text(json.dumps({'base':b.BASE,'manifest_sha256':'bad','branch':'work/metis-r11-20260924-120000'}))
        with self.assertRaisesRegex(b.Blocked,'exact-source'): b.read_state(self.workspace)

    def test_release_branch_is_not_a_publish_target(self):
        self.workspace.mkdir()
        (self.workspace/'session.json').write_text(json.dumps({'base':b.BASE,'manifest_sha256':b.sha256(b.DELTA/'manifest.json'),'branch':'main'}))
        with self.assertRaisesRegex(b.Blocked,'review branch'): b.read_state(self.workspace)

    def test_failed_source_gate_prevents_all_publish_writes(self):
        with patch.object(b,'auth_check'),patch.object(b,'remote_base_check'),patch.object(b,'verify',side_effect=b.Blocked('test failed')),patch.object(b,'git_network') as network,patch.object(b,'git') as git:
            with self.assertRaisesRegex(b.Blocked,'test failed'): b.publish(self.workspace)
            network.assert_not_called();git.assert_not_called()

    def test_existing_remote_branch_is_not_overwritten(self):
        with patch.object(b,'auth_check'),patch.object(b,'remote_base_check'),patch.object(b,'verify',return_value=({'files':[]},{'branch':'work/metis-r11-20260924-120000'})),patch.object(b,'git_network',return_value='existing'),patch.object(b,'git') as git:
            with self.assertRaisesRegex(b.Blocked,'already exists'): b.publish(self.workspace)
            git.assert_not_called()

    def test_engine_mismatch_stops_before_install(self):
        repo=self.workspace/'repo';repo.mkdir(parents=True)
        (repo/'package.json').write_text(json.dumps({'engines':{'node':'22.22.3'}}))
        calls=[]
        with patch.object(b,'bundle_check',return_value={}),patch.object(b,'source_check',return_value={}),patch.object(b,'run',side_effect=lambda *a,**k:calls.append(a) or 'v22.16.0'):
            with self.assertRaisesRegex(b.Blocked,'Node 22.22.3'): b.verify(self.workspace)
        self.assertEqual(calls,[('node','--version')])

    def test_symlinked_session_is_refused(self):
        self.workspace.mkdir();target=self.home/'target.json';target.write_text('{}')
        (self.workspace/'session.json').symlink_to(target)
        with self.assertRaisesRegex(b.Blocked,'symlink'): b.read_state(self.workspace)

    def test_full_gate_failure_has_no_pass_receipt(self):
        repo=self.workspace/'repo';repo.mkdir(parents=True)
        (repo/'package.json').write_text(json.dumps({'engines':{'node':'22.22.3'}}))
        def fake_run(*args,**kw):
            if args == ('node','--version'):return 'v22.22.3'
            raise b.Blocked('install failed')
        with patch.object(b,'bundle_check',return_value={}),patch.object(b,'source_check',return_value={}),patch.object(b,'run',side_effect=fake_run):
            with self.assertRaisesRegex(b.Blocked,'install failed'):b.verify(self.workspace)
        paths = list(self.workspace.rglob('results.json'))
        self.assertEqual(len(paths), 1)
        receipt = json.loads(paths[0].read_text())
        self.assertEqual(receipt['status'], 'source-gates-failed')
        self.assertEqual(receipt['gates'][0]['status'], 'failed')
        self.assertTrue(all(g['status'] == 'not_run' for g in receipt['gates'][1:]))

if __name__=='__main__':unittest.main(verbosity=2)
