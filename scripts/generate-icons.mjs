/**
 * Rasterises the Vitalis mark into the PNG sizes a browser needs before it will
 * treat the site as an installable app. Run with `npm run icons`.
 *
 * The maskable variant matters most: Android crops launcher icons to the device
 * shape, and without a maskable icon Chrome falls back to drawing its own badge
 * over the tile, which is what makes an installed site look like a shortcut.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BRAND = '#1c5cab'

/**
 * @param {number} size    output pixel size
 * @param {number} inset   fraction of the canvas kept clear around the glyph
 * @param {number} radius  corner radius as a fraction of the size
 */
// Bounding box of the pulse path in its own coordinate space, measured from the
// path data below. The glyph is mapped from this box into the icon's safe area,
// which is what keeps it optically centred at every size.
const PATH = 'M6 17.4h4.1l2.2-5.6 3.1 9.6 2.7-7 1.7 3h6.2'
const BOX = { x: 6, y: 11.8, w: 20.2, h: 9.4 }
const STROKE = 2.9

function markSVG(size, inset, radius) {
  const safe = size * (1 - inset * 2)
  // Fit by width. The pulse is a wide, short shape, so height never binds.
  const scale = safe / BOX.w
  const tx = size / 2 - (BOX.x + BOX.w / 2) * scale
  const ty = size / 2 - (BOX.y + BOX.h / 2) * scale
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${BRAND}"/>
  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(5)})">
    <path d="${PATH}" fill="none" stroke="#ffffff" stroke-width="${STROKE}"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
}

const targets = [
  // Standard icons: mark fills most of the tile, rounded like an app icon.
  { file: 'icon-192.png', size: 192, inset: 0.12, radius: 0.22 },
  { file: 'icon-512.png', size: 512, inset: 0.12, radius: 0.22 },
  // Maskable: full bleed square, glyph well inside the 80% safe circle.
  { file: 'icon-maskable-192.png', size: 192, inset: 0.26, radius: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.26, radius: 0 },
  // iOS home screen. No transparency, no rounding, iOS masks it itself.
  { file: 'apple-touch-icon.png', size: 180, inset: 0.16, radius: 0 },
  { file: 'favicon-32.png', size: 32, inset: 0.08, radius: 0.22 },
  { file: 'favicon-16.png', size: 16, inset: 0.06, radius: 0.22 },
]

for (const t of targets) {
  const svg = markSVG(t.size, t.inset, t.radius)
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(join(outDir, t.file), png)
  console.log(`wrote icons/${t.file} (${t.size}px, ${(png.length / 1024).toFixed(1)} kB)`)
}

console.log('done')
