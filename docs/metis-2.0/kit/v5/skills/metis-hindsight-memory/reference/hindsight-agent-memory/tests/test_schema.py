import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from check_schema import inspect_schema, REQUIRED, resolved


def schema():
    d={'info':{'version':'synthetic-test'},'paths':{},'components':{'schemas':{}}}
    for path, methods in REQUIRED.items():
        d['paths'][path]={method:{} for method in methods}
    item={key:{'type':'string'} for key in ('content','document_id','timestamp','context','tags','metadata')}
    retain={'items':{'type':'array','items':{'type':'object','properties':item}},'async':{'type':'boolean'}}
    recall={k:{} for k in ('query','types','tags','max_tokens','budget')}
    recall['tags_match']={'enum':['any','all_strict']}
    for path,props in (('/v1/default/banks/{bank_id}/memories',retain),
                       ('/v1/default/banks/{bank_id}/memories/recall',recall)):
        d['paths'][path]['post']['requestBody']={'content':{'application/json':{'schema':{'properties':props}}}}
    return d

class SchemaTests(unittest.TestCase):
    def test_core_shape(self):
        result=inspect_schema(schema())
        self.assertTrue(result['core_shape_check_passed'])
        self.assertFalse(result['optional_fields_present']['async_operation_id'])

    def test_missing_path(self):
        d=schema();del d['paths']['/version']
        self.assertFalse(inspect_schema(d)['core_shape_check_passed'])

    def test_unknown_strict_tag_enum(self):
        d=schema()
        d['paths']['/v1/default/banks/{bank_id}/memories/recall']['post']['requestBody']['content']['application/json']['schema']['properties']['tags_match']={}
        self.assertFalse(inspect_schema(d)['core_shape_check_passed'])

    def test_ref_resolution(self):
        d=schema();d['components']['schemas']['Demo']={'type':'object'}
        self.assertEqual(resolved({'$ref':'#/components/schemas/Demo'},d),{'type':'object'})

    def test_external_refs_not_fetched(self):
        with self.assertRaises(ValueError):
            resolved({'$ref':'https://untrusted.example/schema.json'}, {})

    def test_cycle_bounded(self):
        with self.assertRaises(ValueError):
            resolved({'$ref':'#/x'},{'x':{'$ref':'#/x'}})

if __name__=='__main__':unittest.main()
