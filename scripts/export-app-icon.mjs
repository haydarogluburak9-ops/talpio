import fs from 'node:fs/promises';
import sharp from 'sharp';

const iconSheet =
  'C:/Users/hayda/.cursor/projects/d-Projects-usta-pilot/assets/c__Users_hayda_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_11_A_u_2026_14_08_49-8c9352ce-f3b4-4562-8157-0a5604d9238c.png';
const out = 'apps/web/public/brand/talpio-logo.png';
const size = 512;
const radius = Math.round(size * 0.2237);

const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>` +
    `</svg>`,
);

const raw = await sharp(iconSheet)
  .extract({ left: 35, top: 32, width: 440, height: 440 })
  .resize(size, size, { fit: 'cover' })
  .png()
  .toBuffer();

const masked = await sharp(raw)
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await fs.writeFile(out, masked);
const meta = await sharp(masked).metadata();
console.log('wrote', out, meta.width, meta.height, 'alpha=', meta.hasAlpha);
