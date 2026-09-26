"""Gate validation tests use EXPLICIT SYNTHETIC evidence in temporary directories.
They do not constitute native app qualification.
"""
import copy,json,tempfile,unittest
from pathlib import Path
from check_acceptance import validate,digest,EvidenceError
C='a'*40;H='b'*64
class EvidenceTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
  evidence={'case_id':'CASE-1','source_commit':C,'artifact_sha256':H,'platform':'windows','status':'PASS','evidence_kind':'native-live','checks':{'required_result_observed':True,'negative_assertions_passed':True,'isolated_profile_verified':True},'native_run_ref':'SYNTHETIC-TEST-NOT-A-DEVICE-RUN'}
  self.file=self.root/'case.json';self.file.write_text(json.dumps(evidence))
  self.report={'schema':'metis.native.acceptance.v2','source_commit':C,'artifact_sha256':H,'platform':'windows','profile_ref':'SYNTHETIC','cases':[{'case_id':'CASE-1','status':'PASS','evidence_kind':'native-live','evidence_file':'case.json','sha256':digest(self.file)}]}
 def tearDown(self): self.temp.cleanup()
 def run_gate(self): return validate(self.report,['CASE-1'],self.root,C,H,'windows')
 def test_shape_and_hash_valid_fixture_is_not_release_approval(self): self.assertEqual(self.run_gate()['status'],'EVIDENCE_FORM_AND_HASH_CHECKS_PASS')
 def test_missing_case(self):
  self.report['cases']=[]
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_duplicate_case(self):
  self.report['cases']*=2
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_unit_is_not_native(self):
  self.report['cases'][0]['evidence_kind']='unit'
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_blocked_is_not_pass(self):
  self.report['cases'][0]['status']='BLOCKED'
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_other_commit(self):
  self.report['source_commit']='c'*40
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_other_artifact(self):
  self.report['artifact_sha256']='c'*64
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_platform_not_interchangeable(self):
  self.report['platform']='macos-electron-preview'
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_tampered_evidence(self):
  self.file.write_text('{}')
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_path_escape(self):
  self.report['cases'][0]['evidence_file']='../private.json'
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_symlink(self):
  link=self.root/'link.json';link.symlink_to(self.file)
  self.report['cases'][0]['evidence_file']='link.json'
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_missing_negative_assertions(self):
  x=json.loads(self.file.read_text());x['checks']['negative_assertions_passed']=False
  self.file.write_text(json.dumps(x));self.report['cases'][0]['sha256']=digest(self.file)
  with self.assertRaises(EvidenceError):self.run_gate()
 def test_evidence_metadata_mismatch(self):
  x=json.loads(self.file.read_text());x['source_commit']='c'*40
  self.file.write_text(json.dumps(x));self.report['cases'][0]['sha256']=digest(self.file)
  with self.assertRaises(EvidenceError):self.run_gate()
if __name__=='__main__':unittest.main(verbosity=2)
