import { API_BASE } from './api';
export function verifiedAssetUrl(value: string, kind: 'metadata' | 'image' | 'any' = 'any'): string | null {
  if (!API_BASE) return null;
  try {
    const base = new URL(API_BASE, window.location.origin);
    const url = new URL(value);
    if (url.origin !== base.origin || url.username || url.password || url.search || url.hash) return null;
    const match = /^\/assets\/[a-f0-9]{64}\/(metadata\.json|image\.(png|svg))$/.exec(url.pathname);
    if (!match || (kind === 'metadata' && match[1] !== 'metadata.json') || (kind === 'image' && match[1] === 'metadata.json')) return null;
    return url.href;
  } catch { return null; }
}
