import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import gateway from '../api/gateway.js';
import assets from '../api/assets.js';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)),'apps/web/dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  let handler;
  if(url.pathname.startsWith('/_network/')){url.searchParams.set('path',url.pathname.slice('/_network/'.length));handler=gateway;}
  else if(url.pathname.startsWith('/chain-assets/')||url.pathname.startsWith('/uploaded-assets/')){const upload=url.pathname.startsWith('/uploaded-assets/');url.searchParams.set('path',url.pathname.slice(upload?17:14));url.searchParams.set('store',upload?'image':'network');handler=assets;}
  if(handler){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1500000){res.writeHead(413);return res.end();}chunks.push(chunk);}req.body=chunks.length?Buffer.concat(chunks):undefined;req.url='/api/adapter?'+url.searchParams;await handler(req,res);return;}
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  const path=resolve(root,'.'+decodeURIComponent(url.pathname));if(path!==root&&!path.startsWith(root+'/')){res.writeHead(404);return res.end();}
  let bytes,file=path;try{bytes=await readFile(file);}catch{file=resolve(root,'index.html');bytes=await readFile(file);}
  res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(503);res.end('Preview unavailable');}
});
server.listen(Number(process.env.GOLD_PREVIEW_PORT??5174),'127.0.0.1',()=>console.log('Solana Gold: http://127.0.0.1:'+(process.env.GOLD_PREVIEW_PORT??5174)));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>process.exit(0)));
