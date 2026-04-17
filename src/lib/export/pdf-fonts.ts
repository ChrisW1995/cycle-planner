import type jsPDF from 'jspdf'

let cachedRegular: string | null = null
let cachedBold: string | null = null

async function fontToBase64(url: string): Promise<string | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Loads NotoSansTC (Traditional Chinese) fonts into a jsPDF document and
 * registers them as 'NotoSansTC' (normal + bold). Fonts are cached at module
 * level — subsequent calls reuse the same base64 payload.
 *
 * Returns true when fonts were registered; false when the TTF files are
 * unavailable (caller should fall back to the default helvetica face, which
 * renders CJK as boxes but will not crash).
 */
export async function loadCJKFont(doc: jsPDF): Promise<boolean> {
  try {
    if (!cachedRegular) cachedRegular = await fontToBase64('/fonts/NotoSansTC.ttf')
    if (!cachedBold) cachedBold = await fontToBase64('/fonts/NotoSansTC-Bold.ttf')
    if (!cachedRegular) return false
    doc.addFileToVFS('NotoSansTC.ttf', cachedRegular)
    doc.addFont('NotoSansTC.ttf', 'NotoSansTC', 'normal')
    if (cachedBold) {
      doc.addFileToVFS('NotoSansTC-Bold.ttf', cachedBold)
      doc.addFont('NotoSansTC-Bold.ttf', 'NotoSansTC', 'bold')
    } else {
      doc.addFont('NotoSansTC.ttf', 'NotoSansTC', 'bold')
    }
    return true
  } catch {
    return false
  }
}
