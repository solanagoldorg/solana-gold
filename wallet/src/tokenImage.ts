import { presetSvg } from '../../packages/config/src/index';
export async function tokenImage(preset: number): Promise<string> {
  const url=URL.createObjectURL(new Blob([presetSvg(preset)],{type:'image/svg+xml'}));
  try {
    const image=new Image();image.src=url;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const context=canvas.getContext('2d');if(!context)throw new Error('Token image could not be prepared.');
    context.drawImage(image,0,0,256,256);return canvas.toDataURL('image/png');
  } finally {URL.revokeObjectURL(url);}
}
