import { createRoot } from 'react-dom/client';
import { GoldWallet } from './GoldWallet';
import type { GatewayOptions } from './gateway';
export { GoldWallet } from './GoldWallet';
export function mountGoldWallet(element: HTMLElement, gateway: GatewayOptions = {}) {
  const root = createRoot(element); root.render(<GoldWallet gateway={gateway}/>); return () => root.unmount();
}
const element = document.getElementById('root');
if (element) mountGoldWallet(element, element.dataset.gateway === '/_network' ? { apiBase: '/_network' } : {});
