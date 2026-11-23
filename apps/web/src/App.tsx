import { useEffect, useState } from 'react';
import Playground from './Playground';
import { Gallery, Explorer, Network } from './Pages';
import Home from './Home';
import Collectors from './Collectors';
import { About, Developers, Token, Roadmap, Overview } from './ProjectPages';
import { useNetwork } from './useNetwork';
import WalletDrawer from '../../../wallet/src/WalletDrawer';
const routes = [['/playground', 'Gold Lab'], ['/gallery', 'Assets'], ['/explorer', 'Explorer'], ['/developers', 'Developers'], ['/about', 'About']];
export default function App() {
  const directWallet = window.location.pathname === '/wallet';
  const [path, setPath] = useState(directWallet ? '/' : window.location.pathname);
  const [walletOpen, setWalletOpen] = useState(directWallet);
  const [walletVisited, setWalletVisited] = useState(directWallet);
  const [menuOpen, setMenuOpen] = useState(false);
  const network = useNetwork();
  const openWallet = () => { setWalletVisited(true); setWalletOpen(true); setMenuOpen(false); };
  useEffect(() => {
    const navigate = () => { setMenuOpen(false); if (window.location.pathname === '/wallet') { setWalletVisited(true); setWalletOpen(true); return; } setPath(window.location.pathname); window.dispatchEvent(new Event('gold-route')); window.scrollTo(0, 0); };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest('a');
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download') || anchor.target || anchor.getAttribute('href')?.startsWith('#')) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || !(/^\/(playground|gallery|explorer|network|token|wallet|developers|builders|collectors|about|roadmap|whitepaper)(\/|$)/.test(url.pathname) || url.pathname === '/')) return;
      event.preventDefault();
      if (url.pathname === '/wallet') { setWalletVisited(true); setWalletOpen(true); setMenuOpen(false); return; }
      window.history.pushState({}, '', url.pathname + url.search); navigate();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('popstate', navigate); document.addEventListener('click', click); document.addEventListener('keydown', escape);
    return () => { window.removeEventListener('popstate', navigate); document.removeEventListener('click', click); document.removeEventListener('keydown', escape); };
  }, []);
  const playground = path === '/playground';
  return <div className="site-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header gold-header">
      <a href="/" className="brand"><img src="/solana-gold-logo.png" alt="" width="44" height="44"/>Solana Gold</a>
      <button className="gold-menu" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
      <nav id="main-navigation" className={menuOpen ? 'gold-navigation open' : 'gold-navigation'} aria-label="Main navigation">{routes.map(([href, label]) => <a key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</a>)}</nav>
      <button className="gold-wallet-button" onClick={openWallet} aria-expanded={walletOpen} aria-controls="gold-wallet-dialog">Open wallet</button>
    </header>
    <main id="main-content" className={playground ? "gold-main gold-main-lab" : "gold-main"}>
      <div hidden={!playground}><Playground canMutate={network.canMutate}/></div>
      {path === '/' ? <Home/> : path.startsWith('/collectors') ? <Collectors path={path}/> : path === '/gallery' ? <Gallery/> : path.startsWith('/explorer') ? <Explorer path={path}/> : path === '/network' ? <Network facts={network.facts} status={network.status}/> : path === '/token' ? <Token/> : path === '/about' ? <About/> : path === '/developers' || path === '/builders' ? <Developers/> : path === '/roadmap' ? <Roadmap/> : path === '/whitepaper' ? <Overview/> : !playground ? <section className="page-section"><h1>Page not found.</h1><a href="/">Return home</a></section> : null}
    </main>
    <footer className="site-footer"><a href="/" className="footer-brand">Solana Gold</a><span>Value in motion.</span><nav aria-label="Footer"><a href="/token">Token</a><a href="/network">Network</a><a href="/roadmap">Roadmap</a><a href="https://github.com/solanagoldorg/solana-gold" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://solana.com/developers/cookbook/games/interact-with-tokens?utm_source=chatgpt.com#:~:text=GOLDSOL" target="_blank" rel="noopener noreferrer">Token cookbook</a></nav></footer>
    {walletVisited ? <WalletDrawer open={walletOpen} onClose={() => { setWalletOpen(false); if (window.location.pathname === '/wallet') window.history.replaceState({}, '', path); }}/> : null}
  </div>;
}
