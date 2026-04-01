import Papa from 'papaparse'
import type { CycleCell } from '@/types'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function exportScheduleToCSV(
  cycleName: string,
  totalWeeks: number,
  cells: CycleCell[]
): string {
  // Build cell map
  const cellMap = new Map<string, string[]>()
  for (const cell of cells) {
    const key = `${cell.week_number}-${cell.day_of_week}`
    if (!cellMap.has(key)) cellMap.set(key, [])
    if (cell.display_value) cellMap.get(key)!.push(cell.display_value)
  }

  // Build rows
  const rows: string[][] = []

  // Header
  rows.push(['', ...DAY_LABELS])

  // Data rows
  for (let week = 1; week <= totalWeeks; week++) {
    const row = [`Week ${week}`]
    for (let day = 1; day <= 7; day++) {
      const key = `${week}-${day}`
      const entries = cellMap.get(key) || []
      row.push(entries.join('\n'))
    }
    rows.push(row)
  }

  return Papa.unparse(rows)
}

export function downloadCSV(csv: string, filename: string) {
  // Add BOM for Excel to recognize UTF-8
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
