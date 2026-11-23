import { tokenImage } from '../../../wallet/src/tokenImage';
import ImageUpload from './ImageUpload';
import { useEffect, useRef, useState } from 'react';
import type { Keypair, Connection } from '@solana/web3.js';
import type { Issuance } from '@solana-gold/chain';
import { assetInputSchema, PRESETS, type AssetDocument, type ActionProgress, type FaucetReceipt } from '@solana-gold/config';
import { API_BASE, EXPECTED_GENESIS, api, parseUnits, shortAddress } from './api';
import { PresetPicker, PresetArt, Notice, Address } from './components';

export default function Playground({ canMutate }: { canMutate: boolean }) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const wallet = useRef<Keypair | null>(null); const connection = useRef<Connection | null>(null);
  const issuance = useRef<Issuance | null>(null); const busyRef = useRef(false); const faucetRequest = useRef<string | null>(null);
  const [publicKey, setPublicKey] = useState(''); const [balance, setBalance] = useState<number | null>(null);
  const kind = 'token' as const; const [name, setName] = useState('Gold Standard'); const [symbol, setSymbol] = useState('GSTD'); const [presetId, setPreset] = useState(0);
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState<ActionProgress | null>(null); const [error, setError] = useState('');
  const [activity, setActivity] = useState<{ label: string; signature: string; mint?: string }[]>([]); const [recipient, setRecipient] = useState(''); const [amount, setAmount] = useState('0.01');
  const [completed, setCompleted] = useState<AssetDocument | null>(null);
  const [mode, setMode] = useState<'send'|'issue'|'inspect'>(() => new URLSearchParams(window.location.search).get('mode') === 'issue' ? 'issue' : 'send');
  const [review, setReview] = useState(false);
  useEffect(() => { const read = () => { const next=new URLSearchParams(window.location.search).get('mode'); if(next === 'issue')setMode('issue'); }; window.addEventListener('popstate',read); window.addEventListener('gold-route',read); return () => { window.removeEventListener('popstate',read); window.removeEventListener('gold-route',read); }; }, []);
  const record = (label: string, signature: string, mint?: string) => setActivity(previous => [{ label, signature, mint }, ...previous].slice(0, 12));
  const refreshBalance = async () => { if (connection.current && wallet.current && canMutate) setBalance(await connection.current.getBalance(wallet.current.publicKey, 'confirmed')); };
  async function run(operation: () => Promise<void>, requiresNetwork = true) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { if (requiresNetwork && !canMutate) throw new Error('The verified experimental network is not connected. Actions are paused.'); await operation(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Action could not be completed.'); if (issuance.current && !completed) setProgress({ phase: 'incomplete', mint: issuance.current.document.mint, message: 'Issuance is incomplete. Resume uses the same mint and existing receipts.' }); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function createWallet() {
    await run(async () => { const sdk = await import('@solana/web3.js'); wallet.current = sdk.Keypair.generate(); setPublicKey(wallet.current.publicKey.toBase58()); if (API_BASE) connection.current = new sdk.Connection(API_BASE + '/api/rpc', { commitment: 'confirmed', disableRetryOnRateLimit: true }); await refreshBalance(); }, false);
  }
  async function claim() {
    await run(async () => {
      if (!wallet.current || !connection.current) throw new Error('Create your test wallet first.');
      faucetRequest.current ??= crypto.randomUUID();
      let receipt = await api<FaucetReceipt>('/api/faucet', { publicKey, requestId: faucetRequest.current });
      if (receipt.signature) { const chain = await import('@solana-gold/chain'); await chain.waitForSignature(connection.current, receipt.signature, 'confirmed'); receipt = await api<FaucetReceipt>('/api/faucet', { publicKey, requestId: faucetRequest.current }); }
      if (receipt.state !== 'confirmed' || !receipt.signature) throw new Error(receipt.message);
      record('1 tGOLD received', receipt.signature); faucetRequest.current = null; await refreshBalance();
    });
  }
  async function mint() {
    await run(async () => {
      if (!wallet.current || !connection.current) throw new Error('Create your test wallet first.');
      const chain = await import('@solana-gold/chain'); const sdk = await import('@solana/web3.js');
      if (!issuance.current) {
        const signer = sdk.Keypair.generate();
        const input = assetInputSchema.parse({ mint: signer.publicKey.toBase58(), kind, name, symbol, presetId });
        const image=customImage ?? await tokenImage(presetId);
        const document=await api<AssetDocument>('/api/upload-assets',{...input,imageData:image.split(',')[1]});
        await Promise.all([fetch(document.uri, { signal: AbortSignal.timeout(10_000) }).then(r => { if (!r.ok) throw new Error('Immutable metadata is not readable.'); }), fetch(document.image, { signal: AbortSignal.timeout(10_000) }).then(r => { if (!r.ok) throw new Error('Immutable artwork is not readable.'); })]);
        issuance.current = { mint: signer, document, preparationSignature: null, issuanceSignature: null };
      }
      const state = issuance.current;
      const existing = await connection.current.getAccountInfo(state.mint.publicKey, 'confirmed');
      if (!existing) await chain.prepareIssuance(connection.current, EXPECTED_GENESIS, wallet.current, state, setProgress);
      const signature = await chain.finishIssuance(connection.current, EXPECTED_GENESIS, wallet.current, state, setProgress);
      await api('/api/upload-gallery', { mint: state.document.mint, contentHash: state.document.contentHash, issuanceSignature: signature });
      setCompleted(state.document); record('Token issued', signature, state.document.mint); await refreshBalance();
    });
  }
  async function transfer(asset: boolean) {
    await run(async () => {
      if (!wallet.current || !connection.current) throw new Error('Create your test wallet first.');
      const chain = await import('@solana-gold/chain');
      const signature = asset && completed ? await chain.transferAsset(connection.current, EXPECTED_GENESIS, wallet.current, completed, recipient, completed.kind === 'nft' ? 1n : parseUnits(amount, 6), setProgress) : await chain.transferNative(connection.current, EXPECTED_GENESIS, wallet.current, recipient, Number(parseUnits(amount, 9)), setProgress);
      record(asset ? 'Asset transferred' : 'tGOLD transferred', signature, asset ? completed?.mint : undefined); await refreshBalance();
    });
  }
  const locked = !!issuance.current;
  return <section className="gold-lab">
    <header className="lab-heading"><div><p className="lab-title">Gold Lab</p><h1>Your next move.</h1></div><p>Transfers, token issuance<br/>and the receipts behind them.</p></header>
    <div className="lab-tabs" role="tablist" aria-label="Gold Lab actions">{([['send','Transfer'],['issue','Create a token'],['inspect','Activity']] as const).map(([id,label]) => <button key={id} role="tab" aria-selected={mode===id} onClick={() => { setMode(id); setReview(false); }}>{label}</button>)}<span className="lab-tab-track" data-position={mode}/></div>
    <div className="lab-layout">
      <div className="lab-workspace">
        {mode === 'send' ? <div className="lab-transfer" key="send"><div className="lab-panel-heading"><h2>Send Gold.</h2><p>A clear view of where it goes.</p></div><div className="transfer-medallion" aria-hidden="true"><img src="/solana-gold-mark.png" alt=""/><div className="transfer-orbit"/></div><form onSubmit={event => { event.preventDefault(); setError(''); try { parseUnits(amount,9); if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient))throw new Error('Enter a valid recipient address.'); setReview(true); } catch(cause) { setError(cause instanceof Error?cause.message:'Check the transfer details.'); } }}><label>Recipient<input value={recipient} onChange={e => { setRecipient(e.target.value); setReview(false); }} autoComplete="off" placeholder="Wallet address"/></label><label className="lab-amount-field">Amount<div className="lab-amount"><input value={amount} onChange={e => { setAmount(e.target.value); setReview(false); }} inputMode="decimal" aria-label="Transfer amount"/><span>tGOLD</span></div></label><button className="button primary" disabled={busy || !publicKey}>Review transfer</button></form>{review ? <div className="lab-review" role="region" aria-label="Transfer review"><h3>Review your transfer</h3><dl><dt>Recipient</dt><dd><Address value={recipient}/></dd><dt>Amount</dt><dd>{amount} tGOLD</dd></dl><p>The final network fee is checked before signing.</p><button className="button primary" disabled={busy || !canMutate} onClick={() => { void transfer(false); setReview(false); }}>Confirm transfer</button></div> : null}</div> : null}
        {mode === 'issue' ? <div className="lab-issuance" key="issue"><div className="lab-panel-heading"><h2>Create a token.</h2><p>An identity for your application.</p></div><div className="lab-token-workbench"><div className="lab-token-preview"><div className="lab-asset-stage" key={customImage ?? presetId}>{customImage ? <img src={customImage} alt="Your token symbol"/> : <PresetArt id={presetId}/>}<div className="lab-strike-light"/></div><div className="lab-token-identity"><strong>{name || 'Your token'}</strong><span>{symbol || 'SYMBOL'}</span></div><span className="lab-art-caption">{customImage ? 'Custom token image' : PRESETS[presetId]?.name}</span></div><div className="lab-token-controls"><div className="field-pair"><label>Token name<input value={name} maxLength={24} disabled={busy || locked} onChange={e=>setName(e.target.value)}/></label><label>Symbol<input value={symbol} maxLength={10} disabled={busy || locked} onChange={e=>setSymbol(e.target.value)}/></label></div><PresetPicker selected={presetId} onChange={id=>{setPreset(id);setCustomImage(null);}} disabled={busy || locked}/><details className="lab-custom-image"><summary>Use your own token image</summary><ImageUpload value={customImage} disabled={busy || locked} onChange={setCustomImage} onBusyChange={setUploadBusy}/></details><dl className="lab-token-params"><div><dt>Supply</dt><dd>1,000,000 tokens</dd></div><div><dt>Decimals</dt><dd>6</dd></div><div><dt>Token standard</dt><dd>Token-2022</dd></div></dl><button className="button primary mint-button" disabled={busy || uploadBusy || !publicKey || !canMutate || !!completed} onClick={()=>{void mint();}}>{busy?'Preparing token…':locked && !completed?'Resume token creation':'Create token'}</button></div></div></div> : null}
        {mode === 'inspect' ? <section className="lab-activity" key="inspect"><div className="lab-panel-heading"><h2>Every move, recorded.</h2><p>Your session's transaction receipts.</p></div>{activity.length ? <ul>{activity.map(a => <li key={a.signature}><span>{a.label}</span><a href={'/explorer/tx/'+a.signature}>{shortAddress(a.signature)}</a></li>)}</ul> : <div className="lab-empty"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="M24 12h32v56l-8-5-8 5-8-5-8 5Z"/><path d="M32 28h16M32 38h16M32 48h8"/></svg><h3>Your story starts here.</h3><p>Completed transfers and token creations appear here.</p><button className="text-button" onClick={()=>setMode('send')}>Make a transfer</button></div>}</section> : null}
        {progress ? <Notice>{progress.message}{progress.mint ? <> <a href={'/explorer/address/'+progress.mint}>View receipt</a></> : null}</Notice> : null}
        {error ? <Notice danger>{error}</Notice> : null}
        {completed ? <div className="completion"><strong>{completed.name} is issued and verified.</strong><Address value={completed.mint}/><button className="text-button" onClick={()=>{issuance.current=null;setCompleted(null);setProgress(null);}}>Create another token</button></div> : null}
      </div>
      <aside className="lab-account"><div className="lab-account-heading"><span>Session wallet</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4ZM4 7V4h13v3M15 12h5v4h-5Z"/></svg></div><div className="lab-balance"><span>Available balance</span><strong>{balance===null?'—':(balance/1e9).toLocaleString(undefined,{maximumFractionDigits:4})}</strong><span>tGOLD</span></div>{publicKey ? <><Address value={publicKey}/><button className="text-button" onClick={()=>{void navigator.clipboard.writeText(publicKey).catch(()=>setError('Select and copy the visible address.'));}}>Copy address</button></> : <><p>Create a wallet for this session.</p><button className="button primary" disabled={busy} onClick={()=>{void createWallet();}}>Create session</button></>}<button className="button outline" disabled={busy || !publicKey || !canMutate} onClick={()=>{void claim();}}>Get test funds</button><div className="lab-connection"><span>{canMutate?'Connected':'Network unavailable'}</span><p>{canMutate?'Ready to review transactions.':'Network actions will be available when a connection is ready.'}</p></div><p className="lab-session-note">Session keys stay in this tab. Closing or refreshing it ends the session.</p><a className="lab-account-link" href="/wallet">Open full wallet</a></aside>
    </div>
  </section>;
}
