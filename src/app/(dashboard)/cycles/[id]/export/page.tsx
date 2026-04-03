'use client'

import { use, useMemo } from 'react'
import { useCycle, useCycleCells, useUpdateCycleStatus } from '@/hooks/use-cycles'
import { generateAllCells } from '@/lib/calculations/schedule-engine'
import { exportScheduleToCSV, downloadCSV } from '@/lib/export/csv-export'
import { exportScheduleToPDF } from '@/lib/export/pdf-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { CycleCell } from '@/types'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: cycle, isLoading } = useCycle(id)
  const { data: savedCells } = useCycleCells(id)
  const updateStatus = useUpdateCycleStatus()

  // Generate display cells
  const displayCells: CycleCell[] = useMemo(() => {
    if (!cycle?.cycle_drugs) return []

    // Use saved cells if available, otherwise generate
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

  // Cell map for preview
  const cellMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const cell of displayCells) {
      const key = `${cell.week_number}-${cell.day_of_week}`
      if (!map.has(key)) map.set(key, [])
      if (cell.display_value) map.get(key)!.push(cell.display_value)
    }
    return map
  }, [displayCells])

  const promptArchive = () => {
    if (!cycle || cycle.status === 'Archived') return
    toast.success('匯出成功', {
      description: '是否將此課表封存？',
      action: {
        label: '封存',
        onClick: () => updateStatus.mutate({ id, status: 'Archived' }),
      },
      duration: 6000,
    })
  }

  const handleCSVExport = () => {
    if (!cycle) return
    const personName = (cycle as any).person?.nickname || 'Unknown'
    const csv = exportScheduleToCSV(
      cycle.name || `${personName} Cycle`,
      cycle.total_weeks,
      displayCells
    )
    downloadCSV(csv, `${personName}_${cycle.name || 'cycle'}.csv`)
    promptArchive()
  }

  const handlePDFExport = () => {
    if (!cycle) return
    const personName = (cycle as any).person?.nickname || 'Unknown'
    exportScheduleToPDF(
      cycle.name || 'Cycle',
      personName,
      cycle.total_weeks,
      displayCells
    )
    promptArchive()
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }
  if (!cycle) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">找不到課表</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href={`/cycles/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">匯出課表</h1>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleCSVExport} size="lg">
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          匯出 CSV
        </Button>
        <Button onClick={handlePDFExport} size="lg" variant="outline">
          <FileText className="mr-2 h-5 w-5" />
          匯出 PDF
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">預覽</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border px-3 py-2 bg-muted text-left font-medium">Week</th>
                {DAY_LABELS.map((day, i) => (
                  <th key={i} className="border border-border px-3 py-2 bg-muted text-center font-medium min-w-[120px]">
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
                    <td className="border border-border px-3 py-2 font-medium text-muted-foreground bg-muted/50">
                      Week {weekNum}
                    </td>
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const dayNum = dayIdx + 1
                      const entries = cellMap.get(`${weekNum}-${dayNum}`) || []
                      return (
                        <td key={dayNum} className="border border-border px-2 py-1.5 align-top text-xs">
                          {entries.map((entry, i) => (
                            <div key={i} className="leading-tight">{entry}</div>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
