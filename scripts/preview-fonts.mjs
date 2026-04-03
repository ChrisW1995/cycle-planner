import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, '..', 'public', 'icons')
const FONTS_DIR = join(__dirname, 'fonts')
const SIZE = 1024

const fonts = [
  { file: 'Montserrat-Bold.ttf', family: 'Montserrat', label: 'Geometric' },
  { file: 'Comfortaa-Bold.ttf', family: 'Comfortaa', label: 'Rounded' },
  { file: 'PlayfairDisplay-Bold.ttf', family: 'PlayfairDisplay', label: 'Elegant' },
  { file: 'JetBrainsMono-Bold.ttf', family: 'JetBrainsMono', label: 'Monospace' },
]

// Register all fonts
for (const f of fonts) {
  GlobalFonts.registerFromPath(join(FONTS_DIR, f.file), f.family)
}

// Load bg and mid layers
const bgImg = await loadImage(join(ICONS_DIR, 'icon-layer-bg.png'))
const midImg = await loadImage(join(ICONS_DIR, 'icon-layer-mid.png'))

for (const f of fonts) {
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  // Draw bg + mid layers
  ctx.drawImage(bgImg, 0, 0)
  ctx.drawImage(midImg, 0, 0)

  // Draw CP text with this font
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const fontSize = SIZE * 0.38
  ctx.font = `bold ${fontSize}px "${f.family}"`

  const m = ctx.measureText('CP')
  const textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const y = SIZE / 2 + textH / 2 - m.actualBoundingBoxDescent
  ctx.fillText('CP', SIZE / 2, y)

  const outPath = join(ICONS_DIR, `font-preview-${f.label.toLowerCase()}.png`)
  writeFileSync(outPath, canvas.toBuffer('image/png'))
  console.log(`✓ ${f.label} (${f.family})`)
}

console.log('\nDone!')
