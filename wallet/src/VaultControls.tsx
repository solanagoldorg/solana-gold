import { useState } from 'react';
type Props = { address: string; saved: boolean; busy: boolean; save: (password: string) => Promise<void>; unlock: (password: string) => Promise<void>; lock: () => void; remove: () => Promise<void> };
export default function VaultControls({ address, saved, busy, save, unlock, lock, remove }: Props) {
  const [editing, setEditing] = useState(false); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [removing, setRemoving] = useState(false); const [error, setError] = useState('');
  async function submit() {
    setError('');
    if (!saved && password !== confirm) { setError('Passwords do not match.'); return; }
    const value = password; setPassword(''); setConfirm('');
    try { if (saved) await unlock(value); else { await save(value); setEditing(false); } } catch (cause) { setError(cause instanceof Error ? cause.message : 'Saved wallet action failed.'); }
  }
  if (!saved && !address) return null;
  return <section className="vault-controls" aria-label="Wallet storage">
    {saved&&!address?<><div className="vault-lock-symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="8" y="14" width="16" height="14" rx="3"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 20v3"/></svg></div><h2>Unlock your wallet</h2><p>Enter your password to continue.</p></>:null}
    {(!saved&&editing)||(saved&&!address)?<form onSubmit={event=>{event.preventDefault();void submit();}}><label>{saved?'Password':'Choose a password'}<input type="password" autoComplete={saved?'current-password':'new-password'} minLength={12} maxLength={128} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)} required/></label>{!saved?<label>Confirm password<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirm} disabled={busy} onChange={event=>setConfirm(event.target.value)} required/></label>:null}{!saved?<p className="vault-warning">Keep this password safe. It cannot be recovered.</p>:null}<button className="primary" disabled={busy}>{saved?'Unlock wallet':'Save wallet'}</button>{!saved?<button type="button" className="wallet-text-button" disabled={busy} onClick={()=>{setEditing(false);setPassword('');setConfirm('');setError('');}}>Cancel</button>:null}</form>:!saved?<button className="wallet-storage-toggle" disabled={busy} onClick={()=>setEditing(true)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 9h10v8H5ZM7 9V6a3 3 0 0 1 6 0v3"/></svg>Save wallet to this browser</button>:<div className="vault-saved-row"><span>Encrypted in this browser</span><button className="wallet-text-button" disabled={busy} onClick={lock}>Lock</button><button className="wallet-text-button" disabled={busy} onClick={()=>setRemoving(value=>!value)}>Remove</button></div>}
    {removing?<div className="vault-remove"><p>Remove this browser’s encrypted copy? Reconcile pending transactions first.</p><button disabled={busy} onClick={()=>{void remove().then(()=>setRemoving(false)).catch(cause=>setError(cause instanceof Error?cause.message:'Could not remove wallet.'));}}>Remove wallet</button><button disabled={busy} onClick={()=>setRemoving(false)}>Cancel</button></div>:null}
    {error?<p role="alert" className="feedback error">{error}</p>:null}
  </section>;
}
