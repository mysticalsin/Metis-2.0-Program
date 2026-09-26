"""Real temporary Git checkout tests. No GitHub, npm, native Mac, or live service calls."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('repair_bridge', ROOT/'metis_continue.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

class RepairTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name).resolve()
        self.workspace = self.home/'workspace'; self.repo = self.workspace/'repo'
        self.repo.mkdir(parents=True)
        self.local_bundle = self.home/'bundle'; self.local_delta = self.local_bundle/'delta'
        shutil.copytree(ROOT/'delta/overlay', self.local_delta/'overlay')
        self.old = json.loads((ROOT/'upgrade/previous-manifest.json').read_text())
        self.new = json.loads((ROOT/'delta/manifest.json').read_text())
        self.git('init','-q'); self.git('config','user.email','fixture@example.invalid')
        self.git('config','user.name','Synthetic Test Fixture')
        self.git('config','core.autocrlf','false')
        for entry in self.old['files']:
            if entry['old_git_blob']:
                target=self.repo/entry['path']; target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes((ROOT/'delta/baseline'/entry['path']).read_bytes())
        (self.repo/'package.json').write_text('{"engines":{"node":"22.22.3"}}\n')
        self.git('add','--all'); self.git('commit','-qm','Synthetic fixture baseline')
        self.base=self.git('rev-parse','HEAD')
        self.branch='work/metis-r11-20260924-083000'
        self.git('switch','-qc',self.branch); self.git('remote','add','origin',b.ORIGIN)
        # Start with the exact v1 overlay, reconstructed from new overlay + reverse repair patch.
        for entry in self.new['files']:
            target=self.repo/entry['path'];target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes((ROOT/'delta/overlay'/entry['path']).read_bytes())
        self.git('apply','--reverse',str(ROOT/'upgrade/media-repair.patch'))
        for entry in self.old['files']:
            self.assertEqual(b.sha256(self.repo/entry['path']),entry['new_sha256'])
        self.old['base_commit']=self.base; self.new['base_commit']=self.base
        (self.local_bundle/'upgrade').mkdir()
        (self.local_bundle/'upgrade/previous-manifest.json').write_text(json.dumps(self.old,indent=2)+'\n')
        (self.local_delta/'manifest.json').write_text(json.dumps(self.new,indent=2)+'\n')
        state={'base':self.base,'manifest_sha256':b.sha256(self.local_bundle/'upgrade/previous-manifest.json'),
               'branch':self.branch,'remote_pushed':False}
        (self.workspace/'session.json').write_text(json.dumps(state)+'\n')
        for attribute,value in [('ROOT',self.local_bundle),('DELTA',self.local_delta),('BASE',self.base)]:
            patcher=patch.object(b,attribute,value);patcher.start();self.addCleanup(patcher.stop)
        patcher=patch.object(b,'bundle_check',return_value=self.new);patcher.start();self.addCleanup(patcher.stop)
        self.change_paths=[e['path'] for e in self.new['files'] if e['new_sha256'] != next(o['new_sha256'] for o in self.old['files'] if o['path']==e['path'])]

    def git(self,*args):
        return subprocess.run(['git','-C',str(self.repo),*args],check=True,capture_output=True,text=True).stdout.strip()
    def snapshot(self):
        return {e['path']:(self.repo/e['path']).read_bytes() for e in self.old['files']}
    def repair(self):
        with contextlib.redirect_stdout(io.StringIO()): b.repair(self.workspace)

    def test_real_git_in_place_upgrade_preserves_repo_and_creates_backup(self):
        before=self.snapshot();self.repair()
        self.assertEqual(self.git('rev-parse','HEAD'),self.base)
        self.assertEqual(self.git('branch','--show-current'),self.branch)
        for e in self.new['files']:self.assertEqual(b.sha256(self.repo/e['path']),e['new_sha256'])
        self.assertEqual(len(list(self.workspace.glob('repair-*'))),1)
        backup=next(self.workspace.glob('repair-*'))
        for name in self.change_paths:self.assertEqual((backup/name).read_bytes(),before[name])
        state=json.loads((self.workspace/'session.json').read_text())
        self.assertFalse(state['remote_pushed']);self.assertEqual(state['source_gates'],'not_verified_after_repair')
        self.assertEqual(self.git('diff','--cached','--name-only'),'')

    def test_idempotent_no_second_backup(self):
        self.repair();before=self.snapshot();self.repair()
        self.assertEqual(before,self.snapshot());self.assertEqual(len(list(self.workspace.glob('repair-*'))),1)

    def test_unrecognized_edit_is_not_overwritten(self):
        target=self.repo/self.change_paths[0];target.write_text(target.read_text()+'// user work\n')
        before=self.snapshot()
        with self.assertRaisesRegex(b.Blocked,'Unrecognized local edit'):self.repair()
        self.assertEqual(before,self.snapshot());self.assertEqual(list(self.workspace.glob('repair-*')),[])

    def test_unrelated_untracked_file_is_not_silently_accepted(self):
        (self.repo/'my-notes.md').write_text('user work')
        before=self.snapshot()
        with self.assertRaisesRegex(b.Blocked,'Checkout changes differ'):self.repair()
        self.assertEqual(before,self.snapshot())

    def test_staged_work_is_preserved(self):
        self.git('add','--',self.change_paths[0]);before=self.git('diff','--cached')
        with self.assertRaisesRegex(b.Blocked,'staged work'):self.repair()
        self.assertEqual(before,self.git('diff','--cached'))

    def test_advanced_commit_is_not_rewritten(self):
        self.git('add','--all');self.git('commit','-qm','User commit')
        commit=self.git('rev-parse','HEAD')
        with self.assertRaisesRegex(b.Blocked,'HEAD/branch changed'):self.repair()
        self.assertEqual(self.git('rev-parse','HEAD'),commit)

    def test_main_branch_never_becomes_repair_target(self):
        self.git('branch','-m','main')
        with self.assertRaisesRegex(b.Blocked,'HEAD/branch changed'):self.repair()

    def test_wrong_origin_is_rejected(self):
        self.git('remote','set-url','origin','https://example.invalid/not-metis.git')
        with self.assertRaisesRegex(b.Blocked,'Origin'):self.repair()

    def test_wrong_push_origin_is_rejected(self):
        self.git('remote','set-url','--push','origin','https://example.invalid/not-metis.git')
        with self.assertRaisesRegex(b.Blocked,'Push origin'):self.repair()

    def test_partial_exact_upgrade_can_resume(self):
        relative=self.change_paths[0]
        (self.repo/relative).write_bytes((self.local_delta/'overlay'/relative).read_bytes())
        self.repair()
        for e in self.new['files']:self.assertEqual(b.sha256(self.repo/e['path']),e['new_sha256'])

    def test_interrupted_write_keeps_old_session_then_resume(self):
        original=b.atomic_bytes;count=0
        def fail_second(path,data,*args):
            nonlocal count
            if self.repo in path.parents:
                count+=1
                if count==2:raise OSError('synthetic disk failure')
            return original(path,data,*args)
        with patch.object(b,'atomic_bytes',side_effect=fail_second):
            with self.assertRaisesRegex(OSError,'disk failure'):self.repair()
        self.assertEqual(json.loads((self.workspace/'session.json').read_text())['manifest_sha256'],b.sha256(self.local_bundle/'upgrade/previous-manifest.json'))
        self.repair()
        for e in self.new['files']:self.assertEqual(b.sha256(self.repo/e['path']),e['new_sha256'])

    def test_source_symlink_rejected_without_mutating_target(self):
        target=self.repo/self.change_paths[0];external=self.home/'outside.txt'
        external.write_bytes(target.read_bytes());target.unlink();target.symlink_to(external)
        before=external.read_bytes()
        with self.assertRaisesRegex(b.Blocked,'Unsafe'):self.repair()
        self.assertEqual(external.read_bytes(),before)

    def test_unknown_session_not_rebound(self):
        path=self.workspace/'session.json';state=json.loads(path.read_text());state['manifest_sha256']='0'*64;path.write_text(json.dumps(state))
        with self.assertRaisesRegex(b.Blocked,'v1 session'):self.repair()

    def test_reported_push_acknowledgment_refused(self):
        path=self.workspace/'session.json';state=json.loads(path.read_text());state['push_acknowledged']=True;path.write_text(json.dumps(state))
        with self.assertRaisesRegex(b.Blocked,'uncommitted, unpublished'):self.repair()

    def test_no_network_called_by_repair(self):
        with patch.object(b,'auth_check',side_effect=AssertionError('no network')),patch.object(b,'gh_api',side_effect=AssertionError('no network')),patch.object(b,'git_network',side_effect=AssertionError('no network')):
            self.repair()

    def test_original_failed_log_retained(self):
        log=self.workspace/'verification-20260924T083659754658Z/06.log';log.parent.mkdir();log.write_text('FAIL existing trace\n')
        self.repair();self.assertEqual(log.read_text(),'FAIL existing trace\n')

class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.ws=Path(self.tmp.name).resolve();self.dir=self.ws/'verification-20260924T083659754658Z';self.dir.mkdir()
        self.log=self.dir/'06.log'
    def test_old_log_diagnosis_no_rerun(self):
        self.log.write_text('\x1b[31mFAIL\x1b[0m lib/example.test.ts > clip order\nAssertionError: expected order\n Test Files 1 failed\n')
        with patch.object(b,'run',side_effect=AssertionError('must not run commands')),contextlib.redirect_stdout(io.StringIO()):b.diagnose(self.ws)
        report=(self.dir/'test-failure-summary.txt').read_text()
        self.assertIn('FAIL lib/example.test.ts',report);self.assertNotIn('\x1b',report)
        self.assertIn(b.sha256(self.log),report)
    def test_obvious_credentials_redacted(self):
        self.log.write_text('FAIL fixture\nAuthorization: Bearer PRIVATE\nCookie: SESSION\nsecret=OTHER\nghp_syntheticTokenForTest123\n')
        report=b.write_failure_summary(self.log).read_text()
        for raw in ['Bearer PRIVATE','SESSION','OTHER','ghp_synthetic']:self.assertNotIn(raw,report)
        self.assertIn('best effort',report)
    def test_symlinked_log_is_refused(self):
        external=self.ws/'external';external.write_text('private');self.log.symlink_to(external)
        with self.assertRaisesRegex(b.Blocked,'symlink'):b.write_failure_summary(self.log)
    def test_success_receipt_not_described_as_failure(self):
        self.log.write_text('pass');(self.dir/'results.json').write_text('{"status":"source-gates-passed"}')
        out=io.StringIO()
        with contextlib.redirect_stdout(out):b.diagnose(self.ws)
        self.assertIn('passed',out.getvalue());self.assertFalse((self.dir/'test-failure-summary.txt').exists())
    def test_missing_logs_does_not_infer_success(self):
        with self.assertRaisesRegex(b.Blocked,'No local'):b.diagnose(self.ws)
    def test_giant_log_marks_bounded_tail(self):
        self.log.write_bytes(b'x'*(4*1024*1024+10)+b'\nFAIL tail\n')
        report=b.write_failure_summary(self.log).read_text();self.assertIn('truncation: True',report)
        self.assertIn('FAIL tail',report);self.assertLess(len(report),10000)
    def test_command_failure_records_completed_failed_and_unrun(self):
        repo=self.ws/'repo';repo.mkdir();(repo/'package.json').write_text('{"engines":{"node":"22.22.3"}}')
        seen=[]
        def fake(*args,**kw):
            if args==('node','--version'):return 'v22.22.3'
            seen.append(args);kw['log'].write_text('FAIL synthetic sixth gate\n' if len(seen)==6 else 'synthetic pass\n')
            if len(seen)==6:raise b.CommandFailed(args,1,kw['log'])
            return ''
        with patch.object(b,'bundle_check',return_value={}),patch.object(b,'source_check',return_value={}),patch.object(b,'run',side_effect=fake),contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(b.CommandFailed):b.verify(self.ws)
        receipts=[p for p in self.ws.glob('verification-*/results.json')]
        self.assertEqual(len(receipts),1);r=json.loads(receipts[0].read_text())
        self.assertEqual(r['status'],'source-gates-failed')
        self.assertEqual([g['status'] for g in r['gates']],['passed']*5+['failed']+['not_run']*5)
        self.assertEqual(r['gates'][5]['exit'],1);self.assertEqual(len(seen),6)
    def test_timeout_never_has_pass_exit(self):
        repo=self.ws/'repo';repo.mkdir();(repo/'package.json').write_text('{"engines":{"node":"22.22.3"}}')
        def fake(*args,**kw):
            if args==('node','--version'):return 'v22.22.3'
            kw['log'].write_text('incomplete run\n');raise subprocess.TimeoutExpired(args,1800)
        with patch.object(b,'bundle_check',return_value={}),patch.object(b,'source_check',return_value={}),patch.object(b,'run',side_effect=fake),contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(subprocess.TimeoutExpired):b.verify(self.ws)
        r=json.loads(next(self.ws.glob('verification-*/results.json')).read_text())
        self.assertEqual(r['gates'][0]['status'],'timed_out');self.assertIsNone(r['gates'][0]['exit'])

class LockTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.ws=Path(self.tmp.name).resolve()
    def test_lock_excludes_second_writer_and_releases(self):
        with b.workspace_lock(self.ws):
            with self.assertRaisesRegex(b.Blocked,'Another bridge'):
                with b.workspace_lock(self.ws):pass
        with b.workspace_lock(self.ws):pass
    def test_symlink_lock_not_followed(self):
        external=self.ws/'external';external.write_text('unchanged');(self.ws/'.metis-bridge.lock').symlink_to(external)
        with self.assertRaisesRegex(b.Blocked,'symlink'):
            with b.workspace_lock(self.ws):pass
        self.assertEqual(external.read_text(),'unchanged')
    def test_atomic_write_does_not_follow_symlink(self):
        external=self.ws/'external';external.write_text('unchanged');path=self.ws/'link';path.symlink_to(external)
        with self.assertRaisesRegex(b.Blocked,'symlink'):b.atomic_bytes(path,b'bad')
        self.assertEqual(external.read_text(),'unchanged')
    def test_missing_workspace_lock_does_not_create_workspace(self):
        missing=self.ws/'missing'
        with self.assertRaisesRegex(b.Blocked,'does not exist'):
            with b.workspace_lock(missing):pass
        self.assertFalse(missing.exists())

if __name__=='__main__':unittest.main(verbosity=2)
