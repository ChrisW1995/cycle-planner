import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, '..', 'public', 'icons')

const source = await loadImage(join(ICONS_DIR, 'cycle-planner-iOS-Dark-1024x1024@1x.png'))

for (const size of [192, 512]) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, size, size)
  const outPath = join(ICONS_DIR, `icon-${size}.png`)
  writeFileSync(outPath, canvas.toBuffer('image/png'))
  console.log(`✓ icon-${size}.png`)
}

console.log('\nDone!')
