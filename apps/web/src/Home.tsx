import { useRef } from 'react';
export default function Home() {
  const coin = useRef<HTMLDivElement>(null);
  return <>
    <section className="gold-hero">
      <div className="gold-hero-copy"><h1>Value<br/>in motion.</h1><p>Solana Gold is an independent SVM project for transfers, tokens and on-chain applications.</p><div className="button-row"><a className="button primary" href="/playground">Explore Gold Lab</a><a className="button outline" href="/developers">Start building</a></div></div>
      <div className="gold-hero-art" ref={coin} onPointerMove={event => { const box=event.currentTarget.getBoundingClientRect(); coin.current?.style.setProperty('--coin-x', ((event.clientX-box.left)/box.width-.5)*18+'deg'); coin.current?.style.setProperty('--coin-y', -((event.clientY-box.top)/box.height-.5)*18+'deg'); }} onPointerLeave={() => { coin.current?.style.setProperty('--coin-x','0deg'); coin.current?.style.setProperty('--coin-y','0deg'); }}><div className="gold-coin-motion"><img src="/solana-gold-logo.png" alt="Solana Gold coin" width="1254" height="1254" fetchPriority="high"/></div><span>Solana Gold</span></div>
    </section>
    <section className="gold-statement"><h2>The next move<br/>is yours.</h2><p>Send a transfer. Create a token. Build an application. Gold brings familiar SVM tools into a focused network experience, with clear transaction details at every step.</p></section>
    <section className="gold-features" aria-label="Explore Solana Gold"><article><div className="gold-feature-symbol" aria-hidden="true">◈</div><h2>Transfer.</h2><p>Choose a recipient, review the amount and follow the transaction through settlement.</p><a href="/playground">Open Gold Lab</a></article><article><div className="gold-feature-symbol" aria-hidden="true">▱</div><h2>Issue.</h2><p>Set a token identity, review its parameters and put it to work in your application.</p><a href="/playground?mode=issue">Create a token</a></article><article><div className="gold-feature-symbol" aria-hidden="true">⌘</div><h2>Build.</h2><p>Use SVM tooling and typed clients to develop applications around transfers and tokens.</p><a href="/developers">Developer resources</a></article></section>
    <section className="gold-builder"><div><h2>Put Gold<br/>to work.</h2><p>Explore token interactions with the official Solana cookbook.</p></div><a className="button primary" href="https://solana.com/el/developers/cookbook/games/interact-with-tokens" target="_blank" rel="noopener noreferrer">Read the token cookbook</a></section>
  </>;
}
