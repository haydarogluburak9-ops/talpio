import fs from 'node:fs/promises';
import sharp from 'sharp';

/** @talpio/ui theme.css — brand-900 / auth panel arka planı */
const PANEL_BG = { r: 13, g: 27, b: 42, alpha: 1 };

const src =
  process.argv[2] ??
  'apps/web/public/brand/talpio-logo-source.png';
const out = 'apps/web/public/brand/talpio-logo.png';
const size = 512;

const flattened = await sharp(src)
  .resize(size, size, { fit: 'contain', background: PANEL_BG })
  .png({ compressionLevel: 9 })
  .toBuffer();

await fs.writeFile(out, flattened);
const meta = await sharp(flattened).metadata();
console.log('wrote', out, meta.width, meta.height);
