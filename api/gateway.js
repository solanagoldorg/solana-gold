const readMethods = new Set(['getGenesisHash','getHealth','getVersion','getLatestBlockhash','getBlockHeight','getBalance','getAccountInfo','getMultipleAccounts','getTokenAccountsByOwner','getTokenLargestAccounts','getTokenSupply','getTokenAccountBalance','getMinimumBalanceForRentExemption','getSignatureStatuses','getTransaction','getFeeForMessage','simulateTransaction','sendTransaction','getSlot','getBlockTime']);
const routes = new Map([['api/network','GET'],['api/status','GET'],['api/gallery','GET,POST'],['api/rpc','POST'],['api/faucet','POST'],['api/assets','POST'],['api/upload-assets','POST'],['api/upload-gallery','POST'],['api/transactions','GET'],['api/address-transactions','GET']]);
export function checkedOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new Error('Invalid deployment origin');
  return u.origin;
}
export function configuration(env = process.env) {
  const gateway=checkedOrigin(env.GOLD_BACKEND_API_URL);
  const images=env.GOLD_IMAGE_API_URL?checkedOrigin(env.GOLD_IMAGE_API_URL):gateway;
  const genesis=env.VITE_EXPECTED_GENESIS_HASH;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(genesis??'')) throw new Error('Network identity required');
  return {gateway,images,genesis,origin:env.GOLD_BACKEND_ORIGIN?checkedOrigin(env.GOLD_BACKEND_ORIGIN):gateway,imageOrigin:env.GOLD_IMAGE_ORIGIN?checkedOrigin(env.GOLD_IMAGE_ORIGIN):images,tokenKind:env.GOLD_BACKEND_TOKEN_KIND||'token'};
}
export function validateRequest(request) {
  const host=request.headers.host||'deployment.invalid';
  const site=(/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)?'http://':'https://')+host;
  let u;try{u=new URL(request.url,site);}catch{return{status:404};}
  const path=u.searchParams.get('path');
  if(u.searchParams.getAll('path').length!==1)return{status:404};
  const allowed=routes.get(path)||(/^api\/gallery\/[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(path??'')?'GET':null);
  if(!allowed)return{status:404};
  if(!allowed.split(',').includes(request.method))return{status:405};
  const query=new URLSearchParams();
  for(const [key,value] of u.searchParams){
    if(key==='path')continue;
    const ok=request.method==='GET'&&((path==='api/gallery'&&['cursor','limit'].includes(key)&&/^\d{1,7}$/.test(value))||(path==='api/transactions'&&key==='cursor'&&/^\d{1,10}:\d{1,4}$/.test(value))||(path==='api/address-transactions'&&((key==='address'&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value))||(key==='before'&&/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(value)))));
    if(!ok||query.has(key))return{status:404};query.set(key,value);
  }
  if(request.headers.origin&&request.headers.origin!==site)return{status:403};
  if(request.headers['sec-fetch-site']==='cross-site')return{status:403};
  if(request.method==='POST'&&request.headers.origin!==site)return{status:403};
  if(request.method==='POST'&&!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type']??''))return{status:415};
  return{status:200,path,pathWithQuery:path+(query.size?'?'+query:'')};
}
export async function boundedBody(result,limit=2097152) {
  if(!result.body)throw new Error('Empty response');const reader=result.body.getReader();let size=0;const chunks=[];
  while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>limit){await reader.cancel();throw new Error('Response limit');}chunks.push(next.value);}
  return Buffer.concat(chunks);
}
function translate(value,tokenKind) {
  if(Array.isArray(value))return value.map(v=>translate(v,tokenKind));
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='kind'&&v===tokenKind?'token':translate(v,tokenKind)]));
}
export default async function handler(request,response) {
  response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('X-Content-Type-Options','nosniff');
  const fail=(code,message)=>{response.statusCode=code;response.end(JSON.stringify({error:{code:'GOLD_NETWORK',message}}));};
  const valid=validateRequest(request);if(valid.status!==200)return fail(valid.status,'Request not allowed.');
  let config;try{config=configuration();}catch{return fail(503,'Network unavailable.');}
  let body;
  if(request.method==='POST'){
    const raw=typeof request.body==='string'||Buffer.isBuffer(request.body)?request.body:JSON.stringify(request.body);
    if(raw===undefined||Buffer.byteLength(raw)>(valid.path==='api/upload-assets'?1500000:32768))return fail(413,'Request exceeds its limit.');
    let payload;try{payload=JSON.parse(raw);}catch{return fail(400,'Valid JSON required.');}
    if(valid.path==='api/rpc'&&(!payload||Array.isArray(payload)||payload.jsonrpc!=='2.0'||!readMethods.has(payload.method)||Object.keys(payload).some(k=>!['jsonrpc','id','method','params'].includes(k))))return fail(400,'RPC request not allowed.');
    if(payload?.kind==='token')payload.kind=config.tokenKind;
    body=JSON.stringify(payload);
  }
  const custom=valid.path.startsWith('api/upload-')||valid.path==='api/transactions'||valid.path==='api/address-transactions'||(request.method==='GET'&&valid.path.startsWith('api/gallery'));
  const path=valid.pathWithQuery.replace('api/upload-assets','api/assets').replace('api/upload-gallery','api/gallery');
  try{
    const upstream=await fetch((custom?config.images:config.gateway)+'/'+path,{method:request.method,body,redirect:'error',headers:{Origin:custom?config.imageOrigin:config.origin,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(15000)});
    if(!upstream.headers.get('content-type')?.includes('application/json'))throw new Error('Unexpected response');
    const raw=await boundedBody(upstream);let value=JSON.parse(raw);
    if(!upstream.ok)return fail(upstream.status,'Network request could not be completed.');
    if(valid.path==='api/network'){
      if(value.expectedGenesisHash!==config.genesis||value.hasMonetaryValue!==false)throw new Error('Network identity mismatch');
      value={...value,name:'Solana Gold',resetPolicy:'Persistent network. Network changes require operator review.'};
    }
    if(valid.path==='api/status')value={...value,message:value.state==='online'?'Connected':'Network unavailable.'};
    response.statusCode=200;response.end(JSON.stringify(translate(value,config.tokenKind)));
  }catch{return fail(503,'Network unavailable.');}
}
