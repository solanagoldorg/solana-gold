import test from 'node:test';
import assert from 'node:assert/strict';
import { adapt } from './adapter.mjs';
import gateway from '../functions/gateway.mjs';
import assets from '../functions/assets.mjs';

test('Netlify preserves browser origin, query parameters, and JSON request bodies', async () => {
  const handle = adapt((req, res) => {
    assert.equal(req.headers.host, 'gold.example.test');
    assert.equal(req.headers.origin, 'https://gold.example.test');
    assert.equal(new URL(req.url).searchParams.get('path'), 'api/rpc');
    assert.deepEqual(JSON.parse(req.body), { jsonrpc: '2.0', method: 'getHealth' });
    res.setHeader('Cache-Control', 'no-store');
    res.end('{"ok":true}');
  });
  const res = await handle(new Request('https://gold.example.test/.netlify/functions/gateway?path=api/rpc', {
    method: 'POST', headers: { Origin: 'https://gold.example.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'getHealth' }),
  }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { ok: true });
});

test('Netlify gateway still rejects unsupported paths and cross-origin writes', async () => {
  const invalid = await gateway(new Request('https://gold.example.test/.netlify/functions/gateway?path=api/admin'));
  assert.equal(invalid.status, 404);
  const cross = await gateway(new Request('https://gold.example.test/.netlify/functions/gateway?path=api/rpc', {
    method: 'POST', headers: { Origin: 'https://other.example.test', 'Content-Type': 'application/json' }, body: '{}',
  }));
  assert.equal(cross.status, 403);
});

test('Netlify preserves binary assets and rejects oversized bodies before the handler', async () => {
  const handle = adapt((req, res) => { res.setHeader('Content-Type', 'image/png'); res.end(Buffer.from([137, 80, 78, 71])); });
  const image = await handle(new Request('https://gold.example.test/image'));
  assert.deepEqual([...new Uint8Array(await image.arrayBuffer())], [137, 80, 78, 71]);
  const large = await handle(new Request('https://gold.example.test/upload', { method: 'POST', body: 'x'.repeat(1_500_001) }));
  assert.equal(large.status, 413);
  const invalid = await assets(new Request('https://gold.example.test/.netlify/functions/assets?store=network&path=../secret'));
  assert.equal(invalid.status, 404);
});
