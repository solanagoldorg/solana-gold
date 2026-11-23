import { readFileSync, existsSync, lstatSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
const manifest=JSON.parse(readFileSync(new URL('./release.json',import.meta.url)));
if(process.env.RAILWAY_PROJECT_ID!=='00000000-0000-4000-8000-000000000002')throw Error('Wrong Railway project');
for(const [name,item] of Object.entries(manifest.binaries)){
  const path='/app/.tools/agave-linux-v3.0.14/solana-release/bin/'+name;
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==item.bytes)throw Error('Wrong executable');
  const hash=createHash('sha256');for await(const bytes of createReadStream(path))hash.update(bytes);
  if(hash.digest('hex')!==item.sha256)throw Error('Executable digest mismatch');
  const version=execFileSync(path,['--version'],{encoding:'utf8',timeout:15000}).trim();
  if(version!==item.version)throw Error('Executable version mismatch');
}
if(process.env.SG_MIGRATION_MODE==='image-probe'){
  const proof={passed:true,scope:'source runtime image ABI and executable verification only; no ledger, key or validator opened',runId:manifest.runId,migrationId:manifest.migrationId,binaries:manifest.binaries};
  console.log(JSON.stringify(proof));
  createServer((request,response)=>{response.setHeader('Content-Type','application/json');response.statusCode=request.url==='/healthz'?200:404;response.end(JSON.stringify(request.url==='/healthz'?proof:{error:'Not found'}));}).listen(3000,'0.0.0.0');
}else{
  if(process.env.SG_MIGRATION_MODE!=='canonical-testnet'||process.env.RAILWAY_SERVICE_ID!=='00000000-0000-4000-8000-000000000001'||process.env.RAILWAY_VOLUME_MOUNT_PATH!=='/data'||process.env.SG_OPERATION||process.env.SG_QA_PREFUND)throw Error('Migration must use the canonical service and normal startup');
  for(const path of ['/data/ledger/genesis.bin','/data/network.json','/data/operator/bootstrap.json','/data/app/app.sqlite'])if(!existsSync(path))throw Error('Existing dataset required; initialization forbidden');
  if(JSON.parse(readFileSync('/data/network.json')).expectedGenesisHash!==manifest.genesis)throw Error('Saved genesis mismatch');
  const reader=spawn(process.execPath,['infra/explorer/block-reader.mjs'],{stdio:'inherit'});
  let stopping=false;
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{stopping=true;reader.kill('SIGTERM');});
  reader.once('error',()=>process.kill(process.pid,'SIGTERM'));
  reader.once('exit',()=>{if(!stopping)process.kill(process.pid,'SIGTERM');});
  await import('../../scripts/railway-start.ts');
}
