import ExcelJS from 'exceljs'
import { formatOralInventory } from '@/lib/utils'
import type { CycleCell, DrugInventoryDelta } from '@/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF282828' },
}
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 10,
  color: { argb: 'FFFFFFFF' },
}
const BODY_FONT: Partial<ExcelJS.Font> = { name: 'Calibri', size: 9 }
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}

export function exportScheduleToXLSX(
  cycleName: string,
  personName: string,
  totalWeeks: number,
  cells: CycleCell[],
  deltas?: DrugInventoryDelta[]
) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(cycleName || 'Cycle')

  // Build cell map
  const cellMap = new Map<string, string[]>()
  for (const cell of cells) {
    const key = `${cell.week_number}-${cell.day_of_week}`
    if (!cellMap.has(key)) cellMap.set(key, [])
    if (cell.display_value) cellMap.get(key)!.push(cell.display_value)
  }

  // --- Schedule Table ---
  // Header row
  const headerRow = ws.addRow(['Week', ...DAY_LABELS])
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = THIN_BORDER
  })

  // Data rows
  for (let week = 1; week <= totalWeeks; week++) {
    const rowData = [`Week ${week}`]
    for (let day = 1; day <= 7; day++) {
      const entries = cellMap.get(`${week}-${day}`) || []
      rowData.push(entries.join('\n'))
    }
    const row = ws.addRow(rowData)
    row.height = 30
    row.eachCell((cell, colNumber) => {
      cell.font = BODY_FONT
      cell.alignment = { wrapText: true, vertical: 'top' }
      cell.border = THIN_BORDER
      if (colNumber === 1) {
        cell.font = { ...BODY_FONT, bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  }

  // Auto-fit column widths
  ws.getColumn(1).width = 12
  for (let c = 2; c <= 8; c++) {
    let maxLen = DAY_LABELS[c - 2].length
    ws.getColumn(c).eachCell((cell) => {
      const val = cell.value?.toString() || ''
      for (const line of val.split('\n')) {
        maxLen = Math.max(maxLen, line.length)
      }
    })
    ws.getColumn(c).width = Math.max(maxLen * 1.3 + 2, 14)
  }

  // --- Drug Stats Table ---
  if (deltas && deltas.length > 0) {
    ws.addRow([]) // blank row

    const statsHeaderRow = ws.addRow(['Drug Stats', '', ''])
    statsHeaderRow.getCell(1).font = { bold: true, size: 11 }

    const statsColHeader = ws.addRow(['藥物', '需求量', '需求數'])
    statsColHeader.eachCell((cell) => {
      cell.fill = HEADER_FILL
      cell.font = HEADER_FONT
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = THIN_BORDER
    })

    for (const d of deltas) {
      const isOral = d.category === 'Oral' || d.category === 'PCT'
      const row = ws.addRow([
        d.drug_name,
        isOral ? formatOralInventory(d.needed_ml, d.tabs_per_box) : `${d.needed_ml} ml`,
        isOral ? `${d.needed_vials} 盒` : `${d.needed_vials} 瓶`,
      ])
      row.eachCell((cell) => {
        cell.font = BODY_FONT
        cell.border = THIN_BORDER
        cell.alignment = { vertical: 'middle' }
      })
    }
  }

  // Save
  wb.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${personName}_${cycleName || 'cycle'}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  })
}
