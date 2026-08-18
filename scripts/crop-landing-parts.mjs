/**
 * Landing mockup'tan hero kompozisyonu ve partner şeridini üretir.
 * Kullanım: node scripts/crop-landing-parts.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'apps/web/public/brand/landing-full.png');
const outDir = path.join(root, 'apps/web/public/brand/landing-parts');
const brandDir = path.join(root, 'apps/web/public/brand');

await mkdir(outDir, { recursive: true });

const meta = await sharp(src).metadata();
console.log('source', meta.width, meta.height);

async function saveScaled(name, box, destPath, scale = 2) {
  const buf = await sharp(src)
    .extract(box)
    .resize({
      width: Math.round(box.width * scale),
      height: Math.round(box.height * scale),
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.6 })
    .png({ compressionLevel: 8 })
    .toBuffer();

  await sharp(buf).toFile(destPath);
  const m = await sharp(destPath).metadata();
  console.log('wrote', name, `${m.width}x${m.height}`);
}

// Sağ hero: telefon + yüzen kartlar (stats şeridi hariç)
const heroBox = { left: 428, top: 52, width: 575, height: 400 };
await saveScaled(
  'hero-compose',
  heroBox,
  path.join(brandDir, 'landing-hero-compose.png'),
  2.5,
);
await saveScaled('hero-compose-preview', heroBox, path.join(outDir, 'hero-compose.png'), 2);

// Parça yedekleri (katmanlı kullanım / ince ayar)
await saveScaled(
  'phone',
  { left: 548, top: 58, width: 255, height: 390 },
  path.join(outDir, 'phone.png'),
  2.5,
);
await saveScaled(
  'card-talep',
  { left: 432, top: 205, width: 200, height: 200 },
  path.join(outDir, 'card-talep.png'),
  2.5,
);
await saveScaled(
  'card-kampanya',
  { left: 742, top: 168, width: 220, height: 245 },
  path.join(outDir, 'card-kampanya.png'),
  2.5,
);
await saveScaled(
  'trend',
  { left: 768, top: 68, width: 190, height: 68 },
  path.join(outDir, 'trend.png'),
  2.5,
);
await saveScaled(
  'reactions',
  { left: 445, top: 140, width: 85, height: 100 },
  path.join(outDir, 'reactions.png'),
  2.5,
);

// Partner logoları
await saveScaled(
  'partners',
  { left: 28, top: 626, width: 968, height: 50 },
  path.join(brandDir, 'landing-partners.png'),
  2.5,
);
