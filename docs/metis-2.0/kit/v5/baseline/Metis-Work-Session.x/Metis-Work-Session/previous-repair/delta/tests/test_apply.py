"""Real Git patch-tool tests in temporary scope fixtures; never the user's repo.
Success fixtures replace ONLY the expected base SHA with their own temporary
commit SHA. No test masquerades as a complete checkout of pinned main.
"""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ApplyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='metis-apply-test-')
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.repo = self.home / 'repo'
        self.bundle = self.home / 'bundle'
        self.repo.mkdir(); self.bundle.mkdir()
        for name in ['manifest.json', 'patches', 'overlay', 'tools']:
            source = ROOT / name
            if source.is_dir(): shutil.copytree(source, self.bundle / name)
            else: shutil.copy2(source, self.bundle / name)
        for source in (ROOT / 'baseline').rglob('*'):
            if source.is_file():
                dest = self.repo / source.relative_to(ROOT / 'baseline')
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(source.read_bytes())
        self.git('init', '-q')
        self.git('add', '.')
        self.git('-c', 'user.name=Isolated Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'Temporary source-scope fixture, not product main')
        self.manifest = json.loads((self.bundle / 'manifest.json').read_text())
        self.manifest['base_commit'] = self.git('rev-parse', 'HEAD')
        self.save_manifest()

    def git(self, *args):
        env = {k:v for k,v in os.environ.items() if not k.startswith('GIT_')}
        result = subprocess.run(['git','-C',str(self.repo),*args], capture_output=True, text=True, env=env, timeout=20)
        if result.returncode: raise AssertionError(result.stderr)
        return result.stdout.strip()

    def save_manifest(self):
        (self.bundle / 'manifest.json').write_text(json.dumps(self.manifest))

    def invoke(self, mode='--check', env=None):
        return subprocess.run([sys.executable,str(self.bundle/'tools/apply.py'),'--repo',str(self.repo),mode],
                              capture_output=True,text=True,timeout=30,env=env)

    def test_check_does_not_modify_checkout(self):
        result=self.invoke();self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.git('status','--porcelain'),'')

    def test_apply_creates_exact_manifest_outputs_without_commit(self):
        before=self.git('rev-parse','HEAD')
        result=self.invoke('--apply');self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.git('rev-parse','HEAD'),before)
        self.assertEqual(self.git('diff','--cached','--name-only'),'')
        for entry in self.manifest['files']:
            self.assertEqual(hashlib.sha256((self.repo/entry['path']).read_bytes()).hexdigest(),entry['new_sha256'])
        self.assertEqual(self.invoke('--apply').returncode,2)  # Never force a second application.

    def test_rejects_wrong_head(self):
        self.manifest['base_commit']='0'*40;self.save_manifest()
        self.assertEqual(self.invoke('--apply').returncode,2)
        self.assertEqual(self.git('status','--porcelain'),'')

    def test_preserves_dirty_user_work(self):
        path=self.repo/'src/shared/metis-wake.ts'; before=path.read_bytes()+b'// user change\n';path.write_bytes(before)
        self.assertEqual(self.invoke('--apply').returncode,2);self.assertEqual(path.read_bytes(),before)

    def test_preserves_untracked_files(self):
        path=self.repo/'user-notes.txt';path.write_text('keep me')
        self.assertEqual(self.invoke('--apply').returncode,2);self.assertEqual(path.read_text(),'keep me')

    def test_rejects_ignored_new_file_collision(self):
        relative=next(e['path'] for e in self.manifest['files'] if e['old_git_blob'] is None)
        (self.repo/'.git/info/exclude').write_text(relative+'\n')
        path=self.repo/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('keep ignored work')
        self.assertEqual(self.git('status','--porcelain'),'')
        self.assertEqual(self.invoke('--apply').returncode,2);self.assertEqual(path.read_text(),'keep ignored work')

    def test_rejects_symlink_target_without_touching_external_file(self):
        relative=next(e['path'] for e in self.manifest['files'] if e['old_git_blob'] is None)
        external=self.home/'external';external.write_text('untouched')
        (self.repo/'.git/info/exclude').write_text(relative+'\n')
        path=self.repo/relative;path.parent.mkdir(parents=True,exist_ok=True);path.symlink_to(external)
        self.assertEqual(self.invoke('--apply').returncode,2);self.assertEqual(external.read_text(),'untouched')

    def test_rejects_patch_tampering(self):
        path=self.bundle/self.manifest['patch']['path'];path.write_bytes(path.read_bytes()+b'\n')
        self.assertEqual(self.invoke('--apply').returncode,2)
        self.assertEqual(self.git('status','--porcelain'),'')

    def test_rejects_overlay_tampering(self):
        path=self.bundle/'overlay'/self.manifest['files'][0]['path'];path.write_bytes(path.read_bytes()+b'\n')
        self.assertEqual(self.invoke('--apply').returncode,2)
        self.assertEqual(self.git('status','--porcelain'),'')

    def test_shadow_validation_rejects_wrong_declared_output(self):
        entry=self.manifest['files'][0]; path=self.bundle/'overlay'/entry['path']
        path.write_bytes(path.read_bytes()+b'// not in patch\n')
        entry['new_sha256']=hashlib.sha256(path.read_bytes()).hexdigest();self.save_manifest()
        result=self.invoke('--apply');self.assertEqual(result.returncode,2)
        self.assertIn('Patch output mismatch',result.stderr)
        self.assertEqual(self.git('status','--porcelain'),'')

    def test_rejects_duplicate_manifest_path(self):
        self.manifest['files'].append(self.manifest['files'][0]);self.save_manifest()
        self.assertEqual(self.invoke('--apply').returncode,2)

    def test_ignores_inherited_git_routing_variables(self):
        env={**os.environ,'GIT_DIR':str(self.home/'does-not-exist'),'GIT_WORK_TREE':str(self.home/'other')}
        result=self.invoke(env=env);self.assertEqual(result.returncode,0,result.stderr)

if __name__=='__main__':unittest.main(verbosity=2)
