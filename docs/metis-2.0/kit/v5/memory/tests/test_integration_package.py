"""Packaging/policy tests only. Mutations are in-memory or disposable fixtures."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('package_check', ROOT/'tools/check_hindsight_package.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
POLICY = json.loads((ROOT/'memory/METIS-MEMORY-CONTRACT.example.json').read_text())

class IntegrationTests(unittest.TestCase):
    def rejected(self, path, value):
        policy=copy.deepcopy(POLICY); dest=policy; parts=path.split('.')
        for key in parts[:-1]: dest=dest[key]
        dest[parts[-1]]=value
        self.assertTrue(m.contract_errors(policy), path)
    def test_complete_package(self): self.assertTrue(m.validate(ROOT)['passed'],m.validate(ROOT))
    def test_good_policy(self): self.assertEqual(m.contract_errors(POLICY),[])
    def test_read_only_no_missing_file_generation(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); self.assertFalse(m.validate(p)['passed']);self.assertEqual(list(p.iterdir()),[])
    def test_symlink_refused_without_reading_target(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); (p/'outside-link').symlink_to('/etc')
            result=m.validate(p)
            self.assertFalse(result['passed'])
            self.assertEqual(result['errors'],['package symlinks forbidden'])
    def test_bad_paths(self):
        for p in ('../outside','/etc/file','safe/../outside','a\\b','','./x',None):
            with self.subTest(p=p):self.assertFalse(m.safe_relative(p))
    def test_valid_paths(self):
        for p in ('SKILL.md','references/03-identity-security.md','templates/.env.example'):
            self.assertTrue(m.safe_relative(p))
    def test_model_bank_selection(self): self.rejected('identity.model_selects_bank',True)
    def test_no_string_boolean(self): self.rejected('identity.model_selects_bank','false')
    def test_tags_not_authority(self): self.rejected('identity.tags_are_authorization',True)
    def test_no_mixed_derivation(self): self.rejected('identity.homogeneous_acl_required',False)
    def test_no_visibility_ingest(self): self.rejected('product.keyboard_toggle_is_memory_trigger',True)
    def test_no_capture_dependency(self): self.rejected('product.memory_failure_stops_meeting',True)
    def test_no_shortcut_dependency(self): self.rejected('product.memory_failure_stops_shortcuts',True)
    def test_no_raw_kind(self): self.rejected('capture.allowed_kinds',POLICY['capture']['allowed_kinds']+['raw_transcript'])
    def test_exclusions_required(self): self.rejected('capture.excluded_kinds',[])
    def test_canonical_first(self): self.rejected('capture.after_canonical_commit',False)
    def test_no_automatic_turns(self): self.rejected('capture.automatic_turn_capture',True)
    def test_replace_only(self): self.rejected('capture.update_mode','append')
    def test_no_public_mcp(self): self.rejected('deployment.raw_client_mcp',True)
    def test_no_automatic_deploy(self): self.rejected('deployment.auto_start_compose',True)
    def test_no_live_smoke_default(self): self.rejected('deployment.live_smoke_auto_run',True)
    def test_no_prequalified_claim(self): self.rejected('deployment.customer_data_ready',True)
    def test_no_desktop_database(self): self.rejected('deployment.desktop_database',True)
    def test_no_implicit_reflect(self): self.rejected('deployment.native_reflect_enabled',True)
    def test_tombstone_required(self): self.rejected('lifecycle.tombstone_before_purge',False)
    def test_forget_preserves_notes(self): self.rejected('lifecycle.forget_deletes_original_meeting',True)
    def test_no_blind_retry(self): self.rejected('lifecycle.unknown_write','retry')
    def test_no_laya_rerank_leak(self): self.rejected('jev.laya_only_enables_jev_rerank',True)
    def test_no_decision_retention(self): self.rejected('jev.decision_can_retain_memory',True)
    def test_budget_types_and_caps(self):
        for value in (True,0,-1,12001,1.5,'12000'):
            with self.subTest(value=value): self.rejected('retrieval.max_envelope_bytes',value)
    def test_no_empty_filter_policy(self): self.rejected('retrieval.nonempty_server_scope_required',False)
    def test_no_stale_results(self): self.rejected('retrieval.final_audience_epoch_recheck',False)
    def test_no_invented_credential(self): self.rejected('deployment.credential_binding','test-token')
    def test_no_implicit_retention(self): self.rejected('lifecycle.retention_days',365)

if __name__ == '__main__':unittest.main()
