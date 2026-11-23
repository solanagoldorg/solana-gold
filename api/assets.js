import {configuration,boundedBody} from './gateway.js';
export default async function handler(request,response){
  response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
  const url=new URL(request.url,'https://deployment.invalid');const path=url.searchParams.get('path'),store=url.searchParams.get('store');
  if(request.method!=='GET'||url.searchParams.getAll('path').length!==1||url.searchParams.getAll('store').length!==1||[...url.searchParams].length!==2||!['network','image'].includes(store)||!/^[a-f0-9]{64}\/(metadata\.json|image\.(svg|png))$/.test(path??'')||(store==='image'&&path.endsWith('.svg'))){response.statusCode=404;return response.end();}
  try{
    const c=configuration();const target=store==='image'?c.images:c.gateway;
    const upstream=await fetch(target+'/assets/'+path,{redirect:'error',headers:{Origin:store==='image'?c.imageOrigin:c.origin},signal:AbortSignal.timeout(10000)});
    const type=path.endsWith('.png')?'image/png':path.endsWith('.svg')?'image/svg+xml':'application/json';
    if(!upstream.ok||!upstream.headers.get('content-type')?.includes(type)){response.statusCode=upstream.status===404?404:502;return response.end();}
    const body=await boundedBody(upstream,path.endsWith('.png')?2097152:24576);
    if(type==='application/json')JSON.parse(body.toString('utf8'));
    if(type==='image/png'&&!body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Invalid image');
    response.setHeader('Content-Type',type);response.setHeader('Cache-Control','public,max-age=31536000,immutable');response.statusCode=200;response.end(body);
  }catch{response.statusCode=503;response.end();}
}
