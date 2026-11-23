// Separate provider identity and genuine held-state proof admission.
// This module never changes the canonical migration entrypoint or its controls.
import { createHash } from 'node:crypto';
export const PROJECT = '00000000-0000-4000-8000-000000000002';
export const ENVIRONMENT = '00000000-0000-4000-8000-000000000003';
export const CANONICAL_SERVICE = '00000000-0000-4000-8000-000000000001';
export const CANONICAL_VOLUME = '00000000-0000-4000-8000-000000000008';
export const WORKER_SERVICE = '00000000-0000-4000-8000-000000000012';
export const WORKER_VOLUME = '00000000-0000-4000-8000-000000000016';
export const RECOVERY_SERVICE = '00000000-0000-4000-8000-000000000006';
export const RECOVERY_VOLUME = '00000000-0000-4000-8000-000000000014';
export const GENESIS = '11111111111111111111111111111111';
export const RAW_ARCHIVE = '1d5a873e8b378555ad825d909c6ce6dd3338b928268664a5e8abee2446912a81';
export const COMPRESSED_ARCHIVE = '319c0e0e83941e5d59884df658b9f710645f61ee30f5a62bfeb11fc41fdbcaaa';
export const FREEZE = '55b668e56a946ec94f0195b03530aba23593bd71d7fd52493d5403b21882757f';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const sha = /^[a-f0-9]{64}$/;
const reads = new Set(['getGenesisHash','getHealth','getVersion','getLatestBlockhash','getBlockHeight','getBalance','getAccountInfo','getMultipleAccounts','getTokenAccountsByOwner','getTokenLargestAccounts','getTokenSupply','getTokenAccountBalance','getMinimumBalanceForRentExemption','getSignatureStatuses','getTransaction','getFeeForMessage','getSlot','getBlockTime']);
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function require(value, message) { if (!value) throw Error(message); }
function timestamp(value, now) { const parsed = Date.parse(value); require(typeof value === 'string' && Number.isFinite(parsed) && parsed <= now, 'Recorded current review time required'); return parsed; }
export function admitTarget(review, env, now = Date.now()) {
  require(review?.schemaVersion === 1 && review.scope === 'isolated-source-http-recovery-target' && review.approved === true && review.providerAssignmentVerified === true, 'Actual target review required');
  timestamp(review.reviewedAt, now);
  const target = review.target;
  require(target?.projectId === PROJECT && target.environmentId === ENVIRONMENT && uuid.test(target.serviceId) && uuid.test(target.volumeId), 'Real separate provider IDs required');
  require(target.serviceId === RECOVERY_SERVICE && target.volumeId === RECOVERY_VOLUME && uuid.test(review.attempt ?? ''), 'Only reviewed existing recovery service and fresh attempt allowed');
  require(![CANONICAL_SERVICE,WORKER_SERVICE].includes(target.serviceId) && ![CANONICAL_VOLUME,WORKER_VOLUME].includes(target.volumeId), 'Canonical and shared worker namespace forbidden');
  const url = new URL(target.api);
  require(url.protocol === 'https:' && url.hostname === 'recovery.solana-gold.example.invalid' && !url.port && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'Separate bare HTTPS recovery origin required');
  require(env.RAILWAY_PROJECT_ID === PROJECT && env.RAILWAY_ENVIRONMENT_ID === ENVIRONMENT && env.RAILWAY_SERVICE_ID === target.serviceId && env.RAILWAY_VOLUME_MOUNT_PATH === '/data' && uuid.test(env.RAILWAY_DEPLOYMENT_ID ?? ''), 'Actual isolated process identity differs');
  require(!env.SG_OPERATION && !env.SG_MIGRATION_MODE && !env.SG_QA_PREFUND, 'No canonical operation modes allowed');
  require(review.freezeSha256 === FREEZE && review.archiveSha256 === COMPRESSED_ARCHIVE && review.rawArchiveSha256 === RAW_ARCHIVE && sha.test(review.archiveHttpBaselineSha256 ?? ''), 'Exact original backup, archive HTTP baseline and new source freeze required');
  return target;
}
export function admitCanary(canary) {
  require(canary && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(canary.wallet) && uuid.test(canary.requestId) && /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(canary.signature) && canary.lamports === 1000000000 && Number.isSafeInteger(canary.balanceLamports) && canary.balanceLamports > 0 && canary.state === 'confirmed' && canary.archiveDerived === true, 'Real archive-time confirmed1TEST canary required');
  return canary;
}
export function permits(request, canary) {
  if (request.method === 'GET' || request.method === 'OPTIONS') return true;
  if (request.method !== 'POST') return false;
  if (request.url === '/api/rpc') {
    const body = request.body;
    return !!body && !Array.isArray(body) && body.jsonrpc === '2.0' && reads.has(body.method) && !Object.hasOwn(body,'upstream') && !Object.hasOwn(body,'url');
  }
  if (request.url !== '/api/faucet') return false;
  const body = request.body;
  return !!body && !Array.isArray(body) && Object.keys(body).sort().join(',') === 'publicKey,requestId' && body.publicKey === canary.wallet && body.requestId === canary.requestId;
}
export function admitHeldContinuity(proof, approval, review, runtime, engine, proofBytes, now = Date.now()) {
  require(proof?.schemaVersion === 1 && proof.scope === 'isolated-source-http-recovery-held-continuity' && proof.passed === true && proof.genesis === GENESIS, 'Actual isolated held-continuity proof required');
  require(proof.freezeSha256 === FREEZE && proof.backupArchiveSha256 === RAW_ARCHIVE && proof.compressedArchiveSha256 === COMPRESSED_ARCHIVE, 'Archive/freeze binding differs');
  require(proof.targetServiceId === review.target.serviceId && proof.targetVolumeId === review.target.volumeId && proof.targetDeploymentId === runtime.deploymentId, 'Continuity target identity differs');
  require(proof.apiBootId === runtime.apiBootId && proof.validatorBootId === runtime.validatorBootId && proof.coreSha256 === runtime.coreSha256 && proof.sourceCommit === runtime.sourceCommit && proof.engineManifestSha256 === digest(JSON.stringify(runtime.engineBuild)), 'Actual held runtime binding differs');
  require(proof.completeAccountComparison?.passed === true && proof.completeAccountComparison.completeCurrentInventory === true && proof.completeAccountComparison.accountCount === 2163 && proof.completeAccountComparison.userAndProgrammeAccountsUnchanged === true && proof.completeAccountComparison.voteFeeMovementReconciled === true, 'Complete current bank and vote-fee reconciliation required');
  require(proof.application?.allHashesMatch === true && proof.application.galleryRows === 617 && proof.application.immutableFiles === 1992 && proof.archivedCanaryVerified === true && proof.canonicalRuntimeUnchanged === true && proof.isolatedArchiveExtractionVerified === true, 'Full archive application/canary/isolation proof missing');
  require(Array.isArray(proof.proofs) && proof.proofs.length >= 3 && proof.proofs.length <= 20 && proof.proofs.every(p=>/^incoming\/[A-Za-z0-9_.-]+\.json$/.test(p.path) && sha.test(p.sha256)), 'Actual ordinary referenced proof files required');
  const at = timestamp(proof.at, now);
  require(approval?.action === 'release-isolated-recovery-replay' && approval.proofSha256 === digest(proofBytes) && approval.targetServiceId === review.target.serviceId && approval.targetVolumeId === review.target.volumeId && approval.genesis === GENESIS && timestamp(approval.approvedAt,now) >= at, 'Explicit reviewed isolated release required');
  require(engine.genesis === GENESIS && engine.binaries?.['solana-test-validator']?.sha256 === '3d3140bf93c9bc967220ffd8989d8b0267b723915d32203132ecc36d2c63a49a', 'Original source engine required');
  const sourceProof = {passed:true,at:proof.at,migrationId:engine.migrationId,runId:engine.runId,genesis:GENESIS,validatorSha256:engine.binaries['solana-test-validator'].sha256,backupArchiveSha256:RAW_ARCHIVE,scope:'separate isolated recovery service continuity; not canonical release',targetServiceId:review.target.serviceId,targetVolumeId:review.target.volumeId,heldProofSha256:digest(proofBytes)};
  const bytes = Buffer.from(JSON.stringify(sourceProof)+'\n');
  return {proofBytes:bytes,release:{action:'enable-source-testnet-writes',migrationId:engine.migrationId,runId:engine.runId,genesis:GENESIS,proofSha256:digest(bytes),approvedAt:approval.approvedAt,scope:'exact archived faucet replay only on separate recovery target'}};
}
