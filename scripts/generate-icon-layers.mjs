import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')
const SIZE = 1024

mkdirSync(OUT_DIR, { recursive: true })

// ── Layer 1: Background (opaque, radial gradient) ──────────────────
function drawBackground() {
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  // Radial gradient: lighter center → dark edges
  const grad = ctx.createRadialGradient(
    SIZE / 2, SIZE * 0.45, SIZE * 0.05,
    SIZE / 2, SIZE / 2, SIZE * 0.72,
  )
  grad.addColorStop(0, '#2a2a40')
  grad.addColorStop(0.6, '#151520')
  grad.addColorStop(1, '#09090b')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  return canvas
}

// ── Layer 2: Mid-ground (transparent bg, decorative cycle ring) ────
function drawMidground() {
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  const cx = SIZE / 2
  const cy = SIZE / 2
  const radius = SIZE * 0.34

  // Outer ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = SIZE * 0.025
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Inner ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = SIZE * 0.015
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2)
  ctx.stroke()

  // Subtle dots around the outer ring
  const dotCount = 24
  for (let i = 0; i < dotCount; i++) {
    const angle = (Math.PI * 2 * i) / dotCount - Math.PI / 2
    const dotR = radius + SIZE * 0.04
    const x = cx + Math.cos(angle) * dotR
    const y = cy + Math.sin(angle) * dotR
    const isMajor = i % 6 === 0
    const dotSize = isMajor ? SIZE * 0.008 : SIZE * 0.004
    const opacity = isMajor ? 0.14 : 0.08

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.beginPath()
    ctx.arc(x, y, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }


  return canvas
}

// ── Layer 3: Foreground (transparent bg, bold "CP" text) ───────────
function drawForeground() {
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const fontSize = SIZE * 0.38
  ctx.font = `bold ${fontSize}px "Helvetica Neue", "Arial", sans-serif`

  // Measure actual glyph bounds for precise centering
  const m = ctx.measureText('CP')
  const textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const y = SIZE / 2 + textH / 2 - m.actualBoundingBoxDescent
  ctx.fillText('CP', SIZE / 2, y)

  return canvas
}

// ── Generate all layers ────────────────────────────────────────────
const layers = [
  { name: 'icon-layer-bg.png', draw: drawBackground },
  { name: 'icon-layer-mid.png', draw: drawMidground },
  { name: 'icon-layer-fg.png', draw: drawForeground },
]

for (const { name, draw } of layers) {
  const canvas = draw()
  const buf = canvas.toBuffer('image/png')
  const outPath = join(OUT_DIR, name)
  writeFileSync(outPath, buf)
  console.log(`✓ ${name} (${buf.length} bytes)`)
}

console.log(`\nDone! Files saved to ${OUT_DIR}`)
