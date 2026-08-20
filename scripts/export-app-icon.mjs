import fs from 'node:fs/promises';
import sharp from 'sharp';

const src = process.argv[2] ?? 'apps/web/public/brand/talpio-logo-source.png';
const out = 'apps/web/public/brand/talpio-logo.png';
/** Siyah dış zemin → şeffaf. */
const BLACK_THRESHOLD = 28;

const resized = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = resized;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
    data[i + 3] = 0;
  }
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 6, adaptiveFiltering: false })
  .toFile(out);

const meta = await sharp(out).metadata();
console.log('wrote', out, meta.width, meta.height, 'alpha=', meta.hasAlpha);
