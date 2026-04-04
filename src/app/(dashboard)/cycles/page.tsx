'use client'

import { useState, useMemo } from 'react'
import { useCycles, useCycle, useCycleCells, useDeleteCycle } from '@/hooks/use-cycles'
import { useDrugs } from '@/hooks/use-drugs'
import { useAuth } from '@/hooks/use-auth'
import { generateAllCells } from '@/lib/calculations/schedule-engine'
import { calculateInventoryDeltas } from '@/lib/calculations/vial-calculator'
import { exportScheduleToXLSX } from '@/lib/export/xlsx-export'
import { exportScheduleToPDF } from '@/lib/export/pdf-export'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Eye, Pencil, Trash2, FileSpreadsheet, FileText, XIcon } from 'lucide-react'
import Link from 'next/link'
import type { CycleStatus, CycleCell } from '@/types'

const statusColors: Record<CycleStatus, string> = {
  Scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Planned: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Completed: 'bg-green-500/10 text-green-500 border-green-500/30',
  Archived: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30',
}
const statusLabels: Record<CycleStatus, string> = {
  Scheduled: '已預定',
  Planned: '已排制',
  Completed: '已完成',
  Archived: '已封存',
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default function CyclesPage() {
  const { data: cycles, isLoading } = useCycles()
  const deleteCycle = useDeleteCycle()
  const { isAdmin } = useAuth()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">課表管理</h1>
        {isAdmin && (
          <Button render={<Link href="/cycles/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              新建課表
          </Button>
        )}
      </div>

      {!cycles?.length ? (
        <p className="text-muted-foreground py-12 text-center">尚無課表</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>人員</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>週數</TableHead>
                <TableHead>開始日期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-28 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id} className={cycle.status === 'Archived' ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{(cycle as any).person?.nickname}</TableCell>
                  <TableCell>{cycle.name || '—'}</TableCell>
                  <TableCell>{cycle.total_weeks} 週</TableCell>
                  <TableCell>
                    {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('zh-TW') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[cycle.status]}>
                      {statusLabels[cycle.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="檢視" onClick={() => setPreviewId(cycle.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="編輯" render={<Link href={`/cycles/${cycle.id}`} />}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && cycle.status === 'Scheduled' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="刪除" onClick={() => setDeleteTarget(cycle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作會刪除課表及所有排程資料，確定嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { deleteTarget && deleteCycle.mutate(deleteTarget); setDeleteTarget(null) }}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cycle Preview Modal */}
      {previewId && (
        <CyclePreviewDialog id={previewId} onClose={() => setPreviewId(null)} />
      )}
    </div>
  )
}

function CyclePreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
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
    exportScheduleToXLSX(cycle.name || `${personName} Cycle`, personName, cycle.total_weeks, displayCells)
  }

  const handlePDFExport = () => {
    if (!cycle) return
    const personName = (cycle as any).person?.nickname || 'Unknown'
    exportScheduleToPDF(cycle.name || 'Cycle', personName, cycle.total_weeks, displayCells)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col" showCloseButton={false}>
        {/* Sticky header with title + export + close */}
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
            {/* Schedule Grid */}
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

            {/* Drug Stats */}
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
                            {isOral ? `${d.needed_ml} 顆` : `${d.needed_ml} ml`}
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
