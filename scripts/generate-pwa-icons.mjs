import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ICONS_DIR = join(ROOT, 'public', 'icons')
const SOURCE_PATH = join(ROOT, 'public', 'bg5n0pbg5n0pbg5n-2.png')

const source = await loadImage(SOURCE_PATH)

// Generate PWA icons
for (const size of [192, 384, 512, 1024]) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, size, size)
  const outPath = join(ICONS_DIR, `icon-${size}.png`)
  writeFileSync(outPath, canvas.toBuffer('image/png'))
  console.log(`✓ icon-${size}.png`)
}

// Copy as the named 1024 icon
copyFileSync(
  join(ICONS_DIR, 'icon-1024.png'),
  join(ICONS_DIR, 'cycle-planner-iOS-Dark-1024x1024@1x.png')
)
console.log('✓ cycle-planner-iOS-Dark-1024x1024@1x.png')

// Generate favicon.ico (32x32 PNG used as ICO)
const faviconSize = 32
const faviconCanvas = createCanvas(faviconSize, faviconSize)
const faviconCtx = faviconCanvas.getContext('2d')
faviconCtx.drawImage(source, 0, 0, faviconSize, faviconSize)
writeFileSync(join(ROOT, 'src', 'app', 'favicon.ico'), faviconCanvas.toBuffer('image/png'))
console.log('✓ favicon.ico')

console.log('\nDone!')
