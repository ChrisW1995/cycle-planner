import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = await loadImage(join(__dirname, '..', 'public', 'icons', 'cycle-planner-iOS-Dark-1024x1024@1x.png'))

// Generate ICO file with 16x16 and 32x32 sizes
// ICO format: header + directory entries + PNG data

function resizeToPng(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, size, size)
  return canvas.toBuffer('image/png')
}

const sizes = [16, 32, 48]
const pngBuffers = sizes.map(s => resizeToPng(s))

// ICO header: 6 bytes
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)           // reserved
header.writeUInt16LE(1, 2)           // type: 1 = ICO
header.writeUInt16LE(sizes.length, 4) // number of images

// Directory entries: 16 bytes each
const dirSize = 16 * sizes.length
let dataOffset = 6 + dirSize
const dirs = []

for (let i = 0; i < sizes.length; i++) {
  const dir = Buffer.alloc(16)
  dir.writeUInt8(sizes[i] < 256 ? sizes[i] : 0, 0) // width
  dir.writeUInt8(sizes[i] < 256 ? sizes[i] : 0, 1) // height
  dir.writeUInt8(0, 2)                                // color palette
  dir.writeUInt8(0, 3)                                // reserved
  dir.writeUInt16LE(1, 4)                             // color planes
  dir.writeUInt16LE(32, 6)                            // bits per pixel
  dir.writeUInt32LE(pngBuffers[i].length, 8)          // image size
  dir.writeUInt32LE(dataOffset, 12)                   // offset
  dataOffset += pngBuffers[i].length
  dirs.push(dir)
}

const ico = Buffer.concat([header, ...dirs, ...pngBuffers])
const outPath = join(__dirname, '..', 'src', 'app', 'favicon.ico')
writeFileSync(outPath, ico)
console.log(`✓ favicon.ico (${ico.length} bytes, ${sizes.join('+')}px)`)
