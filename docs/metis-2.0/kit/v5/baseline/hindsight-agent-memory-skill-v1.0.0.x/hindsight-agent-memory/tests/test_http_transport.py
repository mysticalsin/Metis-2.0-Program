"""Real local loopback HTTP tests of the stdlib transport; not a Hindsight server."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from memory_client import MemoryClient, Limits, Unavailable, UnknownWrite

class Handler(BaseHTTPRequestHandler):
    calls=[]
    mode='json'
    def log_message(self, *_): pass
    def do_GET(self): self.handle_test()
    def do_POST(self): self.handle_test()
    def handle_test(self):
        n=int(self.headers.get('Content-Length','0'))
        data=self.rfile.read(n) if n else b''
        self.__class__.calls.append((self.path, self.headers.get('Authorization'), data))
        if self.__class__.mode=='redirect':
            self.send_response(307);self.send_header('Location','http://127.0.0.1:1/never-follow');self.end_headers();return
        payload=b'{"value":' + b'"' + b'x'*1000+b'"}' if self.__class__.mode=='large' else json.dumps({'results':[],'api_version':'local-transport-test'}).encode()
        self.send_response(200);self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(payload)));self.end_headers();self.wfile.write(payload)

class TransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0), Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join(timeout=2)
    def setUp(self): Handler.mode='json';Handler.calls=[]
    def client(self, **kwargs):
        return MemoryClient(base_url=f'http://127.0.0.1:{self.server.server_port}',api_key='synthetic-key',
              bank_id='test-bank',scope_tags=('purpose:test',),**kwargs)
    def test_real_request_path_body_and_header(self):
        data=self.client().recall('A question')
        self.assertEqual(data['results'],[])
        path,header,body=Handler.calls[0]
        self.assertEqual(header,'Bearer synthetic-key')
        self.assertEqual(json.loads(body)['tags_match'],'all_strict')
        self.assertTrue(path.endswith('/memories/recall'))
    def test_real_redirect_not_followed(self):
        Handler.mode='redirect'
        with self.assertRaises(Unavailable):self.client().version()
        self.assertEqual(len(Handler.calls),1)
    def test_real_response_bound(self):
        Handler.mode='large'
        with self.assertRaises(Unavailable):self.client(limits=Limits(response_bytes=100)).version()
    def test_real_write_success(self):
        self.client().retain(content='Synthetic fact',document_id='doc-1',timestamp='2026-09-25T00:00:00Z',context='Test')
        self.assertEqual(Handler.calls[0][0],'/v1/default/banks/test-bank/memories')
    def test_real_redirect_after_write_unknown(self):
        Handler.mode='redirect'
        with self.assertRaises(UnknownWrite):
            self.client().retain(content='Synthetic fact',document_id='doc-1',timestamp='2026-09-25T00:00:00Z',context='Test')
        self.assertEqual(len(Handler.calls),1)

if __name__=='__main__':unittest.main()
