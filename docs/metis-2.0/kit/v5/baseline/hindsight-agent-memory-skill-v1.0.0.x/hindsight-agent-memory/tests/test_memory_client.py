import json
import sys
import unittest
from dataclasses import replace
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from memory_client import MemoryClient, Limits, AccessDenied, Rejected, Unavailable, UnknownWrite


class FakeTransport:
    def __init__(self, data=None, status=200, content_type='application/json', raw=None, error=None):
        self.raw = raw if raw is not None else json.dumps({} if data is None else data).encode()
        self.status, self.content_type, self.error = status, content_type, error
        self.calls = []

    def __call__(self, *args):
        self.calls.append(args)
        if self.error:
            raise self.error
        return self.status, self.content_type, self.raw


def client(transport=None, **kwargs):
    config = dict(base_url='https://memory.example', api_key='test-key', bank_id='private-bank',
                  scope_tags=('project:one', 'purpose:assistant'), transport=transport or FakeTransport())
    config.update(kwargs)
    return MemoryClient(**config)


def retain(c, **kwargs):
    fields = dict(content='Synthetic project codeword is Cedar.', document_id='source-one',
                  timestamp='2026-09-25T10:00:00-04:00', context='Approved synthetic record.')
    fields.update(kwargs)
    return c.retain(**fields)


class ClientTests(unittest.TestCase):
    def test_fixed_scope_and_endpoint(self):
        fake = FakeTransport({'results': []})
        client(fake).recall('What is the codeword?')
        method, path, headers, body, *_ = fake.calls[0]
        self.assertEqual((method, path), ('POST', '/v1/default/banks/private-bank/memories/recall'))
        data = json.loads(body)
        self.assertEqual(data['tags'], ['project:one', 'purpose:assistant'])
        self.assertEqual(data['tags_match'], 'all_strict')
        self.assertEqual(data['types'], ['world', 'experience'])
        self.assertEqual(headers['Authorization'], 'Bearer test-key')
        self.assertNotIn('test-key', body.decode())

    def test_retain_document_and_metadata(self):
        fake = FakeTransport({'success': True})
        retain(client(fake), metadata={'revision': '12'})
        body = json.loads(fake.calls[0][3])
        self.assertEqual(body['items'][0]['document_id'], 'source-one')
        self.assertEqual(body['items'][0]['metadata']['revision'], '12')
        self.assertFalse(body['async'])
        self.assertNotIn('update_mode', body['items'][0])

    def test_operation_uuid_requires_capability(self):
        op = '3f2b8c1a-9d4e-4a7b-9c2f-1e6d5a4b3c2d'
        for kwargs in ({'async_': True}, {}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                retain(client(), operation_id=op, **kwargs)
        fake = FakeTransport()
        retain(client(fake, supports_operation_id=True), async_=True, operation_id=op)
        self.assertEqual(json.loads(fake.calls[0][3])['operation_id'], op)

    def test_invalid_operation_uuid(self):
        with self.assertRaises(ValueError):
            retain(client(supports_operation_id=True), async_=True, operation_id='not-a-uuid')

    def test_append_requires_capability(self):
        with self.assertRaises(ValueError):
            retain(client(), update_mode='append')
        fake = FakeTransport()
        retain(client(fake, supports_append=True), update_mode='append')
        self.assertEqual(json.loads(fake.calls[0][3])['items'][0]['update_mode'], 'append')

    def test_version_global_path(self):
        fake = FakeTransport({'api_version': 'synthetic'})
        self.assertEqual(client(fake).version()['api_version'], 'synthetic')
        self.assertEqual(fake.calls[0][1], '/version')

    def test_document_and_operation_paths(self):
        fake = FakeTransport(); c = client(fake)
        c.document('source-one'); c.operation('operation-one')
        self.assertTrue(fake.calls[0][1].endswith('/documents/source-one'))
        self.assertTrue(fake.calls[1][1].endswith('/operations/operation-one'))

    def test_local_http_allowed(self):
        for origin in ('http://localhost:8888', 'http://127.0.0.1:8888', 'http://[::1]:8888'):
            with self.subTest(origin=origin):
                client(base_url=origin)

    def test_dangerous_origins_rejected(self):
        for origin in ('http://remote.example', 'https://user:pass@memory.example',
                       'https://memory.example/path', 'https://memory.example?q=x',
                       'https://memory.example#fragment', 'file:///tmp/x',
                       'https://memory.example\n', 'https://memory.example:99999'):
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                client(base_url=origin)

    def test_empty_or_ambiguous_scope_rejected(self):
        for tags in ((), [], ('',), ('a', 'a'), (' a',), ('a ',), ('a' * 129,)):
            with self.subTest(tags=tags), self.assertRaises(ValueError):
                client(scope_tags=tags)

    def test_path_injection_rejected(self):
        for identifier in ('../other', '..', '/other', 'a?x=b', 'a%2fb', '', ' x', 'a#b'):
            with self.subTest(identifier=identifier), self.assertRaises(ValueError):
                client(bank_id=identifier)
            with self.subTest(document_id=identifier), self.assertRaises(ValueError):
                client().document(identifier)

    def test_secret_header_injection_rejected(self):
        for key in ('', 'a\r\nX-Foo: x', 'with space', 'é'):
            with self.subTest(key=key), self.assertRaises(ValueError):
                client(api_key=key)

    def test_reflect_opt_in(self):
        with self.assertRaises(ValueError):
            client().reflect('Question')
        fake = FakeTransport({'text': 'Advice'})
        self.assertEqual(client(fake, allow_reflect=True).reflect('Question')['text'], 'Advice')
        body = json.loads(fake.calls[0][3])
        self.assertEqual(body['tags_match'], 'all_strict')
        self.assertNotIn('context', body)

    def test_budget_rejected_before_transport(self):
        fake = FakeTransport(); c = client(fake)
        for tokens in (0, -1, 2001, True, 1.5):
            with self.subTest(tokens=tokens), self.assertRaises(ValueError):
                c.recall('Question', max_tokens=tokens)
        with self.assertRaises(ValueError):
            c.recall('Question', budget='unlimited')
        self.assertEqual(len(fake.calls), 0)

    def test_input_size_bounded_before_sending(self):
        fake = FakeTransport(); c = client(fake, limits=Limits(request_bytes=500))
        with self.assertRaises(ValueError):
            retain(c, content='é' * 400)
        self.assertEqual(len(fake.calls), 0)

    def test_invalid_timestamp_rejected(self):
        for timestamp in ('2026-09-25', '2026-09-25T10:00:00', 'yesterday', ''):
            with self.subTest(timestamp=timestamp), self.assertRaises(ValueError):
                retain(client(), timestamp=timestamp)

    def test_nonstring_metadata_rejected(self):
        with self.assertRaises(ValueError):
            retain(client(), metadata={'revision': 1})

    def test_nonmapping_metadata_rejected(self):
        for value in (False, 0, [], ["not-a-pair"]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                retain(client(), metadata=value)

    def test_access_denial_not_unavailable_or_success(self):
        for status in (401, 403):
            with self.subTest(status=status), self.assertRaises(AccessDenied):
                client(FakeTransport(status=status)).recall('Question')

    def test_http_rejection(self):
        for status in (400, 404, 409, 410, 413, 422):
            with self.subTest(status=status), self.assertRaises(Rejected):
                retain(client(FakeTransport(status=status)))

    def test_ambiguous_writes_no_automatic_retry(self):
        fake = FakeTransport(error=TimeoutError('secret source body'))
        with self.assertRaises(UnknownWrite) as caught:
            retain(client(fake))
        self.assertEqual(len(fake.calls), 1)
        self.assertNotIn('secret source', str(caught.exception))

    def test_read_outage_distinct(self):
        with self.assertRaises(Unavailable):
            client(FakeTransport(error=OSError('offline'))).recall('Question')

    def test_redirect_or_server_error_no_retry(self):
        for status in (301, 302, 307, 429, 500, 503):
            fake = FakeTransport(status=status)
            with self.subTest(status=status), self.assertRaises(UnknownWrite):
                retain(client(fake))
            self.assertEqual(len(fake.calls), 1)

    def test_response_size_limit(self):
        with self.assertRaises(Unavailable):
            client(FakeTransport(raw=b' ' * 501), limits=Limits(response_bytes=500)).recall('Question')

    def test_bad_json_and_object_shape(self):
        for raw in (b'not JSON', b'[]', b'null', b'{"value":NaN}', b'\xff'):
            with self.subTest(raw=raw), self.assertRaises(Unavailable):
                client(FakeTransport(raw=raw)).recall('Question')

    def test_malformed_success_write_is_unknown(self):
        with self.assertRaises(UnknownWrite):
            retain(client(FakeTransport(raw=b'not JSON')))

    def test_content_type_rejected(self):
        with self.assertRaises(Unavailable):
            client(FakeTransport(content_type='text/html')).recall('Question')

    def test_delete_confirmation(self):
        fake = FakeTransport(); c = client(fake)
        with self.assertRaises(ValueError):
            c.delete_document('one', confirm_document_id='two')
        self.assertEqual(len(fake.calls), 0)
        c.delete_document('one', confirm_document_id='one')
        self.assertEqual(fake.calls[0][0], 'DELETE')

    def test_204_response(self):
        self.assertEqual(client(FakeTransport(status=204, raw=b'')).delete_document('one', confirm_document_id='one'), {})

    def test_limits_validation(self):
        for change in ({'timeout_seconds': 0}, {'timeout_seconds': float('nan')},
                       {'response_bytes': True}, {'request_bytes': -1}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                Limits(**change)

    def test_query_and_capability_types(self):
        for query in ('', '  ', 'x' * 8001):
            with self.subTest(query=query), self.assertRaises(ValueError):
                client().recall(query)
        with self.assertRaises(ValueError):
            client(allow_reflect='yes')

if __name__ == '__main__':
    unittest.main()
