import fs from 'node:fs/promises';
import sharp from 'sharp';

const identity = 'apps/web/public/brand/talpio-identity.png';
const lockupSource = 'apps/web/public/brand/talpio-lockup.png';
const outLight = 'apps/web/public/brand/talpio-lockup-light.png';
const outDark = 'apps/web/public/brand/talpio-lockup-dark.png';

/** Kimlik sayfası — açık zemin yatay lockup (T + lacivert Talp + turuncu io). */
const LIGHT_REGION = { left: 280, top: 52, width: 720, height: 94 };

const WHITE_THRESHOLD = 248;
const DARK_TEXT_THRESHOLD = 80;

async function exportLightLockup() {
  await sharp(identity).extract(LIGHT_REGION).png().toFile(outLight);
}

/** Koyu zemin: mevcut lockup’tan siyah metni beyaza, zeminı şeffafa çevir. */
async function exportDarkLockup() {
  const { data, info } = await sharp(lockupSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isOrange = r > 160 && g > 60 && g < 160 && b < 80;
    const isWhiteBg = r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;

    if (isWhiteBg) {
      data[i + 3] = 0;
      continue;
    }

    if (!isOrange && r <= DARK_TEXT_THRESHOLD && g <= DARK_TEXT_THRESHOLD && b <= DARK_TEXT_THRESHOLD) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outDark);
}

await exportLightLockup();
await exportDarkLockup();

for (const file of [outLight, outDark]) {
  const meta = await sharp(file).metadata();
  console.log('wrote', file, meta.width, meta.height, 'alpha=', meta.hasAlpha);
}
