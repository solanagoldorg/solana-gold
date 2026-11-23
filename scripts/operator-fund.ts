import { readFileSync } from 'node:fs';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { assertNetwork, submitInstructions } from '@solana-gold/chain';
const expected = '11111111111111111111111111111111';
if (process.env.RAILWAY_PROJECT_ID !== '00000000-0000-4000-8000-000000000002' || process.env.RAILWAY_SERVICE_ID !== '00000000-0000-4000-8000-000000000001') throw new Error('Operator funding is confined to the designated TEST service.');
const plan = JSON.parse(readFileSync('/data/operator/qa-funding-public.json', 'utf8')) as { genesis: string; wallets: { publicKey: string; lamports: number }[]; funder: { publicKey: string; lamports: number } };
if (plan.genesis !== expected || plan.wallets.length !== 20) throw new Error('Funding plan identity/session count mismatch.');
const connection = new Connection('http://127.0.0.1:8899', 'confirmed'); await assertNetwork(connection, expected);
const operator = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync('/data/operator/bootstrap.json', 'utf8')) as number[]));
for (const target of [...plan.wallets, plan.funder]) {
  if (!Number.isSafeInteger(target.lamports) || target.lamports <= 0 || target.lamports > 6_000_000_000) throw new Error('Invalid bounded TEST funding amount.');
  const destination = new PublicKey(target.publicKey);
  const balance = await connection.getBalance(destination, 'confirmed');
  if (balance >= target.lamports) continue; // Restart/retry cannot double the requested prefunding.
  const signature = await submitInstructions(connection, expected, operator, [SystemProgram.transfer({ fromPubkey: operator.publicKey, toPubkey: destination, lamports: target.lamports - balance })]);
  console.log(JSON.stringify({ publicKey: target.publicKey, signature, targetLamports: target.lamports, scope: 'operator prefunding of valueless TEST QA accounts; public faucet limits unchanged' }));
}
