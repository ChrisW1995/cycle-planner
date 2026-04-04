import * as XLSX from 'xlsx'
import type { CycleCell } from '@/types'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function exportScheduleToXLSX(
  cycleName: string,
  personName: string,
  totalWeeks: number,
  cells: CycleCell[]
) {
  // Build cell map
  const cellMap = new Map<string, string[]>()
  for (const cell of cells) {
    const key = `${cell.week_number}-${cell.day_of_week}`
    if (!cellMap.has(key)) cellMap.set(key, [])
    if (cell.display_value) cellMap.get(key)!.push(cell.display_value)
  }

  // Build rows
  const rows: string[][] = []
  rows.push(['Week', ...DAY_LABELS])

  for (let week = 1; week <= totalWeeks; week++) {
    const row = [`Week ${week}`]
    for (let day = 1; day <= 7; day++) {
      const entries = cellMap.get(`${week}-${day}`) || []
      row.push(entries.join('\n'))
    }
    rows.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Auto-fit column widths
  const colWidths = rows[0].map((_, colIdx) => {
    let maxLen = 0
    for (const row of rows) {
      const cellVal = row[colIdx] || ''
      // For multiline cells, use the longest line
      const lines = cellVal.split('\n')
      for (const line of lines) {
        maxLen = Math.max(maxLen, line.length)
      }
    }
    return { wch: Math.max(maxLen + 2, 8) }
  })
  ws['!cols'] = colWidths

  // Enable text wrapping for cells with newlines
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (ws[addr]) {
        if (!ws[addr].s) ws[addr].s = {}
        ws[addr].s.alignment = { wrapText: true, vertical: 'top' }
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, cycleName || 'Cycle')
  XLSX.writeFile(wb, `${personName}_${cycleName || 'cycle'}.xlsx`)
}
