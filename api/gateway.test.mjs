import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{configuration,validateRequest} from './gateway.js';
const genesis='11111111111111111111111111111111';
const env={GOLD_BACKEND_API_URL:'https://api.example.test',GOLD_IMAGE_API_URL:'https://images.example.test',VITE_EXPECTED_GENESIS_HASH:genesis,GOLD_BACKEND_ORIGIN:'https://web.example.test',GOLD_BACKEND_TOKEN_KIND:'legacy-token'};
const request=(path,method='GET',body)=>({url:'/api/gateway?path='+encodeURIComponent(path),method,headers:{host:'gold.example.test',origin:'https://gold.example.test','content-type':'application/json'},body});
const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=value;}});
test('deployment requires verified identity and fixed HTTPS origins',()=>{
 assert.equal(configuration(env).gateway,'https://api.example.test');
 for(const value of ['http://api.example.test','https://api.example.test/path','https://api.example.test?x=1', 'https://api.example.test/#x'])assert.throws(()=>configuration({...env,GOLD_BACKEND_API_URL:value}));
 assert.throws(()=>configuration({...env,VITE_EXPECTED_GENESIS_HASH:''}));
});
test('paths, methods and browser origins cannot select an upstream or administration route',()=>{
 for(const path of ['api/admin','https://api.example.test','../../secret','api/rpc?url=x'])assert.equal(validateRequest(request(path)).status,404);
 const cross=request('api/rpc','POST');cross.headers.origin='https://evil.example';assert.equal(validateRequest(cross).status,403);
 assert.equal(validateRequest(request('api/status','DELETE')).status,405);
 const injected=request('api/gallery');injected.url+='&url=https://evil.example';assert.equal(validateRequest(injected).status,404);
});
test('gateway keeps deployment origins private and verifies network identity',async()=>{
 const prior=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));const fetcher=globalThis.fetch;Object.assign(process.env,env);
 try{
  globalThis.fetch=async()=>Response.json({expectedGenesisHash:genesis,hasMonetaryValue:false,name:'Upstream network'});
  const good=response();await handler(request('api/network'),good);assert.equal(good.statusCode,200);assert.equal(JSON.parse(good.body).name,'Solana Gold');assert.ok(!good.body.includes(env.GOLD_BACKEND_API_URL));
  globalThis.fetch=async()=>Response.json({expectedGenesisHash:'wrong',hasMonetaryValue:false});const bad=response();await handler(request('api/network'),bad);assert.equal(bad.statusCode,503);
 }finally{globalThis.fetch=fetcher;for(const[k,v]of Object.entries(prior)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
test('token compatibility never forwards caller credentials, and unsupported RPC never leaves the proxy',async()=>{
 const prior=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));const fetcher=globalThis.fetch;Object.assign(process.env,env);let calls=0;
 try{
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.example.test/api/assets');assert.equal(options.headers.Authorization,undefined);assert.equal(options.headers.Cookie,undefined);assert.equal(JSON.parse(options.body).kind,'legacy-token');return Response.json({kind:'legacy-token'});};
  const good=response();const req=request('api/assets','POST',{kind:'token'});req.headers.authorization='caller';await handler(req,good);assert.equal(JSON.parse(good.body).kind,'token');
  const bad=response();await handler(request('api/rpc','POST',{jsonrpc:'2.0',method:'requestAirdrop',params:[]}),bad);assert.equal(bad.statusCode,400);assert.equal(calls,1);
 }finally{globalThis.fetch=fetcher;for(const[k,v]of Object.entries(prior)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
