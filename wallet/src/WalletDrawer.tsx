import { lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './drawer.css';
const Wallet = lazy(() => import('./GoldWallet'));
const gateway = { apiBase: '/_network' as const };
// The dock stays mounted while hidden, keeping the unlocked session in memory.
export default function WalletDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null); const close = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(null); const closeAction = useRef(onClose);
  useEffect(() => { closeAction.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add('gold-wallet-open');
    close.current?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeAction.current(); return; }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]') ?? []).filter(node => node.getClientRects().length);
      const first=nodes[0], last=nodes[nodes.length-1];
      if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.classList.remove('gold-wallet-open'); document.removeEventListener('keydown', keydown);
      const target = previous.current;
      if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true });
    };
  }, [open]);
  return createPortal(<div className="wallet-drawer-overlay" hidden={!open} onClick={event=>{if(event.target===event.currentTarget)closeAction.current();}}>
    <aside className="wallet-drawer" ref={panel} id="gold-wallet-dialog" role="dialog" aria-modal="true" aria-labelledby="gold-wallet-heading">
      <header className="wallet-drawer-top"><div><img src="/solana-gold-mark.png" alt="" width="26" height="26"/><h2 id="gold-wallet-heading">Gold Wallet</h2></div><button ref={close} type="button" aria-label="Close wallet panel" onClick={()=>closeAction.current()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
      <div className="wallet-drawer-content"><Suspense fallback={<p className="wallet-drawer-loading" role="status">Opening wallet…</p>}><Wallet gateway={gateway} presentation="drawer"/></Suspense></div>
    </aside>
  </div>, document.body);
}
