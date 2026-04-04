'use client'

import { useMemo } from 'react'
import { useCycle, useCycleCells } from '@/hooks/use-cycles'
import { useDrugs } from '@/hooks/use-drugs'
import { generateAllCells } from '@/lib/calculations/schedule-engine'
import { calculateInventoryDeltas } from '@/lib/calculations/vial-calculator'
import { exportScheduleToXLSX } from '@/lib/export/xlsx-export'
import { exportScheduleToPDF } from '@/lib/export/pdf-export'
import { formatOralInventory } from '@/lib/utils'
import { statusLabels } from '@/lib/constants/cycle-status'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileSpreadsheet, FileText, XIcon } from 'lucide-react'
import type { CycleCell } from '@/types'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

interface CycleExportDialogProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CycleExportDialog({ id, open, onOpenChange }: CycleExportDialogProps) {
  const { data: cycle, isLoading } = useCycle(id)
  const { data: savedCells } = useCycleCells(id)
  const { data: allDrugs } = useDrugs()

  const displayCells: CycleCell[] = useMemo(() => {
    if (!cycle?.cycle_drugs) return []
    if (savedCells && savedCells.length > 0) return savedCells
    const manualOverrides = savedCells?.filter((c) => c.is_manual_override) || []
    const generated = generateAllCells(cycle.cycle_drugs as any, cycle.total_weeks, manualOverrides)
    return generated.map((cell, i) => ({
      id: `gen-${i}`,
      cycle_id: id,
      cycle_drug_id: cell.cycle_drug_id,
      week_number: cell.week_number,
      day_of_week: cell.day_of_week,
      display_value: cell.display_value,
      ml_amount: cell.ml_amount,
      is_manual_override: cell.is_manual_override,
      created_at: '',
    }))
  }, [cycle, savedCells, id])

  const cellMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const cell of displayCells) {
      const key = `${cell.week_number}-${cell.day_of_week}`
      if (!map.has(key)) map.set(key, [])
      if (cell.display_value) map.get(key)!.push(cell.display_value)
    }
    return map
  }, [displayCells])

  const inventoryDeltas = useMemo(() => {
    if (!cycle?.cycle_drugs) return []
    return calculateInventoryDeltas(cycle.cycle_drugs as any, allDrugs as any)
  }, [cycle, allDrugs])

  const handleXLSXExport = () => {
    if (!cycle) return
    const personName = (cycle as any).person?.nickname || 'Unknown'
    exportScheduleToXLSX(cycle.name || `${personName} Cycle`, personName, cycle.total_weeks, displayCells, inventoryDeltas)
  }

  const handlePDFExport = () => {
    if (!cycle) return
    const personName = (cycle as any).person?.nickname || 'Unknown'
    exportScheduleToPDF(cycle.name || 'Cycle', personName, cycle.total_weeks, displayCells, inventoryDeltas)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[85vw] xl:max-w-[1200px] max-h-[90vh] flex flex-col" showCloseButton={false}>
        <div className="flex items-start justify-between gap-4">
          <DialogHeader className="flex-1">
            <DialogTitle>
              {isLoading ? '載入中...' : (cycle?.name || `${(cycle as any)?.person?.nickname} 的課表`)}
            </DialogTitle>
            {cycle && (
              <DialogDescription>
                {cycle.total_weeks} 週
                {cycle.start_date && ` | 開始: ${new Date(cycle.start_date).toLocaleDateString('zh-TW')}`}
                {' | '}
                {statusLabels[cycle.status]}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleXLSXExport} disabled={isLoading}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              XLSX
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDFExport} disabled={isLoading}>
              <FileText className="mr-1.5 h-4 w-4" />
              PDF
            </Button>
            <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
              <XIcon className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">載入中...</div>
        ) : cycle && (
          <div className="space-y-4 overflow-y-auto flex-1 -mx-4 px-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border px-3 py-2 bg-muted text-left font-medium whitespace-nowrap">Week</th>
                    {DAY_LABELS.map((day, i) => (
                      <th key={i} className="border border-border px-3 py-2 bg-muted text-center font-medium min-w-[100px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: cycle.total_weeks }, (_, weekIdx) => {
                    const weekNum = weekIdx + 1
                    return (
                      <tr key={weekNum}>
                        <td className="border border-border px-3 py-2 font-medium text-muted-foreground bg-muted/50 whitespace-nowrap">
                          Week {weekNum}
                        </td>
                        {Array.from({ length: 7 }, (_, dayIdx) => {
                          const entries = cellMap.get(`${weekNum}-${dayIdx + 1}`) || []
                          return (
                            <td key={dayIdx} className="border border-border px-2 py-1.5 align-top text-xs">
                              {entries.map((entry, i) => (
                                <div key={i} className="leading-tight whitespace-nowrap">{entry}</div>
                              ))}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {inventoryDeltas.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>藥物</TableHead>
                      <TableHead className="text-right">需求量</TableHead>
                      <TableHead className="text-right">需求數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryDeltas.map((d) => {
                      const isOral = d.category === 'Oral' || d.category === 'PCT'
                      return (
                        <TableRow key={d.drug_id}>
                          <TableCell className="font-medium">{d.drug_name}</TableCell>
                          <TableCell className="text-right">
                            {isOral ? formatOralInventory(d.needed_ml, d.tabs_per_box) : `${d.needed_ml} ml`}
                          </TableCell>
                          <TableCell className="text-right">
                            {isOral ? `${d.needed_vials} 盒` : `${d.needed_vials} 瓶`}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
