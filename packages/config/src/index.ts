import { z } from 'zod';

export const BRAND = { name: 'Solana Gold', ticker: 'GOLD', tagline: 'Value in motion.', mintAddress: 'kpD9MSKBDSNFqvsEAVkQH1PhKGwVYGD5Coo7YFggoLd', githubUrl: 'https://github.com/solanagoldorg/solana-gold' } as const;
export const TEST_LAMPORTS = 1_000_000_000;
export const TOKEN_SUPPLY = 1_000_000_000_000n;
export const LIMITS = {
  rpcBodyBytes: 32_768, rpcResponseBytes: 2_097_152, rpcTimeoutMs: 10_000,
  rpcConcurrency: 32, globalRps: 100, readsPerIpMinute: 1_200, submissionsPerIpMinute: 60,
  faucetWalletDay: 3, faucetIpDay: 10, faucetGlobalDay: 1_000,
  assetBodyBytes: 4_096, assetFileBytes: 24_576, assetsIpHour: 150,
  assetsGlobalDay: 1_000, assetStorageBytes: 536_870_912, databaseBytes: 268_435_456,
  confirmedTimeoutMs: 15_000, finalizedTimeoutMs: 60_000,
} as const;
export const RPC_METHODS = [
  'getGenesisHash', 'getHealth', 'getVersion', 'getLatestBlockhash', 'getBlockHeight', 'getBalance',
  'getAccountInfo', 'getMultipleAccounts', 'getTokenAccountsByOwner', 'getTokenLargestAccounts',
  'getTokenSupply', 'getTokenAccountBalance', 'getMinimumBalanceForRentExemption',
  'getSignatureStatuses', 'getTransaction', 'getFeeForMessage', 'simulateTransaction',
  'sendTransaction', 'getSlot', 'getBlockTime',
] as const;
export const addressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Enter a valid public address.');
export const signatureSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{80,90}$/, 'Invalid transaction signature.');
export const assetInputSchema = z.object({
  mint: addressSchema, kind: z.enum(['token', 'nft']),
  name: z.string().trim().min(1).refine(s => [...s].length <= 24, 'Name is limited to 24 characters.'),
  symbol: z.string().regex(/^[A-Za-z0-9]{1,10}$/, 'Use 1–10 letters or numbers.'),
  presetId: z.number().int().min(0).max(3),
}).strict();
export const faucetInputSchema = z.object({ publicKey: addressSchema, requestId: z.string().uuid() }).strict();
export const galleryInputSchema = z.object({ mint: addressSchema, issuanceSignature: signatureSchema, contentHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const rpcInputSchema = z.object({ jsonrpc: z.literal('2.0'), id: z.union([z.string().max(100), z.number().finite(), z.null()]), method: z.enum(RPC_METHODS), params: z.array(z.unknown()).max(4).optional() }).strict();
export type AssetInput = z.infer<typeof assetInputSchema>;
export type AssetDocument = AssetInput & { contentHash: string; uri: string; image: string };
export type ActionPhase = 'idle' | 'preparing' | 'simulating' | 'submitted' | 'confirmed' | 'finalizing' | 'complete' | 'incomplete' | 'failed';
export type ActionProgress = { phase: ActionPhase; message: string; signature?: string; mint?: string };
export type NetworkFacts = {
  name: string; mode: 'local' | 'remote'; expectedGenesisHash: string | null;
  denomination: 'TEST'; operatorCount: 1; hasMonetaryValue: false;
  tokenProgram: string; associatedTokenProgram: string; resetPolicy: string;
};
export type NetworkStatus = { state: 'online' | 'degraded' | 'unconfigured'; slot: number | null; genesisMatches: boolean; lastProgressAt: string | null; message: string };
export type FaucetReceipt = { requestId: string; state: 'pending' | 'submitted' | 'confirmed' | 'uncertain' | 'failed'; signature: string | null; lamports: number; message: string };
export type GalleryEntry = AssetDocument & { issuanceSignature: string; verifiedAt: string; currentOwner?: string | null; ownershipState?: 'held' | 'burned' | 'unavailable' };
export const PRESETS = [
  { id: 0, name: 'Gold bar', color: '#e4b640' },
  { id: 1, name: 'Gold mark', color: '#f0cd75' },
  { id: 2, name: 'Sun seal', color: '#c89638' },
  { id: 3, name: 'Gold circuit', color: '#e1b45b' },
] as const;
export function presetSvg(id: number): string {
  if (!PRESETS[id]) throw new Error('Unknown preset.');
  const prefix = 'gold-' + id;
  const fill = 'url(#' + prefix + '-metal)';
  const defs = `<defs><linearGradient id="${prefix}-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f2d69b"/><stop offset=".25" stop-color="#be9559"/><stop offset=".5" stop-color="#e1bf87"/><stop offset=".75" stop-color="#8b6738"/><stop offset="1" stop-color="#caa367"/></linearGradient><radialGradient id="${prefix}-light"><stop stop-color="#241d14"/><stop offset="1" stop-color="#000000"/></radialGradient></defs>`;

  const art = [
    `<path d="m58 169 17-87 104-12 21 92-29 28-87 9Z" fill="#724f20"/><path d="m58 169 17-87 104-12-14 96Z" fill="${fill}" stroke="#f7d77f" stroke-width="1.5"/><path d="m165 166 14-96 21 92-29 28Z" fill="#8c631f"/><path d="m58 169 107-3 6 24-87 9Z" fill="#c69b3c"/><path d="m85 99 78-8-10 59-79 5Z" fill="none" stroke="#8d641e"/><text x="117" y="125" text-anchor="middle" fill="#654817" font-family="Arial,sans-serif" font-weight="700" font-size="14" transform="rotate(-5 117 125)">GOLD</text><path d="m98 139 38-3" stroke="#88621e"/>`,
    `<path d="M84 64h110q7 0 3 6l-23 24q-2 2-6 2H58q-7 0-3-6l25-24q2-2 4-2Zm-26 48h110q4 0 6 2l23 24q4 6-3 6H84q-4 0-6-2l-23-24q-4-6 3-6Zm26 48h110q7 0 3 6l-23 24q-2 2-6 2H58q-7 0-3-6l25-24q2-2 4-2Z" fill="${fill}"/>`,
    `<g transform="translate(128 128)" stroke="${fill}" stroke-width="4">${Array.from({length:24},(_,i)=>`<path d="M0-72v-18" transform="rotate(${i*15})"/>`).join('')}</g><circle cx="128" cy="128" r="60" fill="none" stroke="${fill}" stroke-width="3"/><circle cx="128" cy="128" r="48" fill="${fill}"/><path d="m128 95 19 33-19 33-19-33Z" fill="#59401a"/>`,
    `<g fill="none" stroke="#7f642f" stroke-width="2"><path d="M28 74h40l21 21m-61 83h40l21-21M228 74h-40l-21 21m61 83h-40l-21-21M128 25v43m0 163v-43M25 128h43m163 0h-43"/></g><rect x="78" y="78" width="100" height="100" rx="20" fill="#261d10" stroke="${fill}" stroke-width="3"/><rect x="91" y="91" width="74" height="74" rx="12" fill="${fill}"/><path d="m111 128 17-23 17 23-17 23Z" fill="#32220e"/><g fill="#c49c5b"><circle cx="28" cy="74" r="4"/><circle cx="28" cy="178" r="4"/><circle cx="228" cy="74" r="4"/><circle cx="228" cy="178" r="4"/><circle cx="128" cy="25" r="4"/><circle cx="128" cy="231" r="4"/></g>`,
  ][id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${defs}<rect width="256" height="256" fill="url(#${prefix}-light)"/><path d="M16 20h18m-18 0v18m222-18h-18m18 0v18M16 236h18m-18 0v-18m222 18h-18m18 0v-18" stroke="#70592c" fill="none"/>${art}</svg>`;
}
