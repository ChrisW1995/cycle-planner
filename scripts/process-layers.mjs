import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, '..', 'public', 'icons')
const SIZE = 1024

// ── Helpers ────────────────────────────────────────────────────

async function loadToCanvas(filename) {
  const img = await loadImage(join(ICONS_DIR, filename))
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')
  const srcSize = Math.min(img.width, img.height)
  const srcX = (img.width - srcSize) / 2
  const srcY = (img.height - srcSize) / 2
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE)
  return canvas
}

function removeCorners(canvas, inset = SIZE * 0.05, radius = SIZE * 0.15) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE)
  const data = imgData.data

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = x - inset, ny = y - inset
      const w = SIZE - inset * 2, h = SIZE - inset * 2
      let outside = nx < 0 || nx > w || ny < 0 || ny > h
      if (!outside) {
        if (nx < radius && ny < radius) outside = Math.hypot(nx - radius, ny - radius) > radius
        else if (nx > w - radius && ny < radius) outside = Math.hypot(nx - (w - radius), ny - radius) > radius
        else if (nx < radius && ny > h - radius) outside = Math.hypot(nx - radius, ny - (h - radius)) > radius
        else if (nx > w - radius && ny > h - radius) outside = Math.hypot(nx - (w - radius), ny - (h - radius)) > radius
      }
      if (outside) {
        const i = (y * SIZE + x) * 4
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

// Dark → transparent, white content (for orbits mid-ground)
function darkToWhite(canvas, threshold = 45) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    if (lum < threshold) {
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
    } else {
      const alpha = Math.min(255, Math.round((lum - threshold) / (255 - threshold) * 255))
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = alpha
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Dark → transparent, preserve original colors (for colored syringe)
function darkToColor(canvas, threshold = 30) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    if (lum < threshold) {
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
    } else {
      data[i + 3] = Math.min(255, Math.round((lum - threshold) / (255 - threshold) * 255))
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// ── Background layer ───────────────────────────────────────────
function createBackground() {
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(SIZE / 2, SIZE * 0.45, SIZE * 0.05, SIZE / 2, SIZE / 2, SIZE * 0.72)
  grad.addColorStop(0, '#2a2a40')
  grad.addColorStop(0.6, '#151520')
  grad.addColorStop(1, '#09090b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)
  return canvas
}

// ── Generate ───────────────────────────────────────────────────
console.log('Processing layers...\n')

// Background
const bg = createBackground()
writeFileSync(join(ICONS_DIR, 'icon-layer-bg.png'), bg.toBuffer('image/png'))
console.log('✓ icon-layer-bg.png')

// Mid-ground: orbits on pure black background — simple darkToWhite
const midRaw = await loadToCanvas('layer-mid-clean.png')
const mid = darkToWhite(midRaw)
writeFileSync(join(ICONS_DIR, 'icon-layer-mid.png'), mid.toBuffer('image/png'))
console.log('✓ icon-layer-mid.png')

// Foreground: user-provided colored syringe
const fgRaw = await loadToCanvas('layer-fg-user.png')
removeCorners(fgRaw)
const fg = darkToColor(fgRaw)
writeFileSync(join(ICONS_DIR, 'icon-layer-fg.png'), fg.toBuffer('image/png'))
console.log('✓ icon-layer-fg.png')

// Composite preview
const preview = createCanvas(SIZE, SIZE)
const pctx = preview.getContext('2d')
pctx.drawImage(bg, 0, 0)
pctx.drawImage(mid, 0, 0)
pctx.drawImage(fg, 0, 0)
writeFileSync(join(ICONS_DIR, 'icon-preview-composite.png'), preview.toBuffer('image/png'))
console.log('✓ icon-preview-composite.png')

console.log('\nDone!')
