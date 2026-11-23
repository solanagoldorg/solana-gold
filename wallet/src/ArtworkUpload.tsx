import { useState, useRef } from 'react';
import { uploadBytes } from './upload';
export function ArtworkUpload({ value, disabled, onChange, onBusy }: { value: string | null; disabled: boolean; onChange: (image: string | null) => void; onBusy: (busy: boolean) => void }) {
  const [error, setError] = useState(''); const [reading, setReading] = useState(false); const readingRef = useRef(false);
  const input = useRef<HTMLInputElement>(null); const [filename, setFilename] = useState(''); const [dragging, setDragging] = useState(false);
  async function choose(file?: File) {
    if (!file || disabled || readingRef.current) return;
    setError('');
    if (!['image/png','image/jpeg'].includes(file.type) || file.size > 1_048_576) { setError('Choose a PNG or JPG up to 1 MB.'); return; }
    readingRef.current = true; setReading(true); onBusy(true);
    try {
      const bitmap = await createImageBitmap(file); const pixels = bitmap.width * bitmap.height; bitmap.close();
      if (pixels > 4_194_304) throw new Error('Token image is limited to 4 million pixels.');
      const result = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Token image could not be read.')); reader.readAsDataURL(file); });
      uploadBytes(result); setFilename(file.name); onChange(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Token image could not be read.'); }
    finally { readingRef.current = false; setReading(false); onBusy(false); }
  }
  const unavailable = disabled || reading;
  return <div className="wallet-image-upload"><strong>Or use your own image.</strong><p>PNG or JPG · up to 1 MB · up to 4 million pixels</p><div className={'wallet-upload-drop' + (dragging ? ' is-dragging' : '')} aria-busy={reading} onDragOver={event => { event.preventDefault(); if (!unavailable) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (unavailable) return; if (event.dataTransfer.files.length !== 1) { setError('Choose one token image at a time.'); return; } void choose(event.dataTransfer.files[0]); }}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></svg><div><strong>{reading ? 'Checking your image…' : dragging ? 'Drop your token image here' : value ? 'Token image is ready' : 'Drop your token image here'}</strong><p>{value ? filename || 'Selected token image' : 'Choose a token image.'}</p></div><button type="button" disabled={unavailable} onClick={() => input.current?.click()}>{reading ? 'Reading…' : value ? 'Change token image' : 'Upload token image'}</button><input ref={input} type="file" hidden tabIndex={-1} accept="image/png,image/jpeg" aria-label="Upload token image" disabled={unavailable} onChange={event => { void choose(event.target.files?.[0]); event.currentTarget.value = ''; }}/></div>{reading ? <p role="status">Checking token image…</p> : null}{value ? <div className="selected-art"><img src={value} alt="Selected token image preview"/><button type="button" disabled={unavailable} onClick={() => { onChange(null); setFilename(''); }}>Use a preset instead</button></div> : null}{error ? <p role="alert" className="feedback error">{error}</p> : null}</div>;
}
