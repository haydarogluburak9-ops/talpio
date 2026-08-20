import fs from 'node:fs/promises';
import sharp from 'sharp';

/** @talpio/ui theme.css — brand-900 / auth panel arka planı */
const PANEL_BG = { r: 13, g: 27, b: 42, alpha: 1 };

const iconSheet =
  'C:/Users/hayda/.cursor/projects/d-Projects-usta-pilot/assets/c__Users_hayda_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_11_A_u_2026_14_08_49-8c9352ce-f3b4-4562-8157-0a5604d9238c.png';
const out = 'apps/web/public/brand/talpio-logo.png';
const size = 512;

const raw = await sharp(iconSheet)
  .extract({ left: 35, top: 32, width: 440, height: 440 })
  .resize(size, size, { fit: 'cover' })
  .png()
  .toBuffer();

const flattened = await sharp({
  create: {
    width: size,
    height: size,
    channels: 3,
    background: PANEL_BG,
  },
})
  .composite([{ input: raw, blend: 'over' }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await fs.writeFile(out, flattened);
const meta = await sharp(flattened).metadata();
console.log('wrote', out, meta.width, meta.height);
