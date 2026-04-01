'use client'

import { use, useState, useMemo, useCallback } from 'react'
import { useCycle, useCycleCells, useAddCycleDrug, useRemoveCycleDrug, useSaveCycleCells, useUpdateCycle, useUpdateCycleStatus } from '@/hooks/use-cycles'
import { useAuth } from '@/hooks/use-auth'
import { ScheduleGrid } from '@/components/cycles/schedule-grid'
import { DrugSelector } from '@/components/cycles/drug-selector'
import { CalculationSummary } from '@/components/cycles/calculation-summary'
import { generateAllCells } from '@/lib/calculations/schedule-engine'
import { calculateInventoryDeltas } from '@/lib/calculations/vial-calculator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Minus, Save, ArrowLeft, Download, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { CycleStatus, CycleCell } from '@/types'

const statusColors: Record<CycleStatus, string> = {
  Scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Planned: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Completed: 'bg-green-500/10 text-green-500 border-green-500/30',
}
const statusLabels: Record<CycleStatus, string> = {
  Scheduled: '已預定',
  Planned: '已排制',
  Completed: '已完成',
}

export default function CycleBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: cycle, isLoading } = useCycle(id)
  const { data: savedCells } = useCycleCells(id)
  const addCycleDrug = useAddCycleDrug()
  const removeCycleDrug = useRemoveCycleDrug()
  const saveCells = useSaveCycleCells()
  const updateCycle = useUpdateCycle()
  const updateStatus = useUpdateCycleStatus()
  const { isAdmin } = useAuth()

  const [drugSelectorOpen, setDrugSelectorOpen] = useState(false)
  const [localOverrides, setLocalOverrides] = useState<Map<string, { value: string; ml: number | null }>>(new Map())

  // Generate cells from cycle drugs
  const generatedCells = useMemo(() => {
    if (!cycle?.cycle_drugs) return []
    const manualOverrides = savedCells?.filter((c) => c.is_manual_override) || []
    return generateAllCells(cycle.cycle_drugs as any, cycle.total_weeks, manualOverrides)
  }, [cycle, savedCells])

  // Convert generated cells to CycleCell-like objects for the grid
  const displayCells: CycleCell[] = useMemo(() => {
    return generatedCells.map((cell, i) => {
      const key = `${cell.week_number}-${cell.day_of_week}`
      const override = localOverrides.get(`${key}-${cell.cycle_drug_id}`)
      return {
        id: `gen-${i}`,
        cycle_id: id,
        cycle_drug_id: cell.cycle_drug_id,
        week_number: cell.week_number,
        day_of_week: cell.day_of_week,
        display_value: override?.value || cell.display_value,
        ml_amount: override?.ml ?? cell.ml_amount,
        is_manual_override: cell.is_manual_override || !!override,
        created_at: '',
      }
    })
  }, [generatedCells, localOverrides, id])

  // Inventory deltas
  const inventoryDeltas = useMemo(() => {
    if (!cycle?.cycle_drugs) return []
    return calculateInventoryDeltas(cycle.cycle_drugs as any)
  }, [cycle])

  const inventoryDeficitsMap = useMemo(() => {
    const map = new Map<string, number>()
    inventoryDeltas.forEach((d) => map.set(d.drug_id, d.deficit))
    return map
  }, [inventoryDeltas])

  // Handlers
  const handleAddDrug = useCallback((data: { drug_id: string; weekly_dose?: number; daily_dose?: number; start_week: number; end_week: number }) => {
    addCycleDrug.mutate({
      cycle_id: id,
      ...data,
      weekly_dose: data.weekly_dose || undefined,
      daily_dose: data.daily_dose || undefined,
    })
  }, [id, addCycleDrug])

  const handleSave = useCallback(() => {
    const cellsToSave = displayCells.map((c) => ({
      cycle_id: id,
      cycle_drug_id: c.cycle_drug_id,
      week_number: c.week_number,
      day_of_week: c.day_of_week,
      display_value: c.display_value,
      ml_amount: c.ml_amount,
      is_manual_override: c.is_manual_override,
    }))
    saveCells.mutate({ cycle_id: id, cells: cellsToSave })
  }, [displayCells, id, saveCells])

  const handleWeekChange = useCallback((delta: number) => {
    if (!cycle) return
    const newWeeks = Math.max(1, cycle.total_weeks + delta)
    updateCycle.mutate({ id, total_weeks: newWeeks })
  }, [cycle, id, updateCycle])

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }
  if (!cycle) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">找不到課表</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href={`/people/${cycle.person_id}`} />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {cycle.name || `${(cycle as any).person?.nickname} 的課表`}
              </h1>
              <Badge variant="outline" className={statusColors[cycle.status]}>
                {statusLabels[cycle.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {cycle.total_weeks} 週
              {cycle.start_date && ` | 開始: ${new Date(cycle.start_date).toLocaleDateString('zh-TW')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Select
                value={cycle.status}
                onValueChange={(v: string | null) => v && updateStatus.mutate({ id, status: v as CycleStatus })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">已預定</SelectItem>
                  <SelectItem value="Planned">已排制</SelectItem>
                  <SelectItem value="Completed">已完成</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSave} disabled={saveCells.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveCells.isPending ? '儲存中...' : '儲存'}
              </Button>
            </>
          )}
          <Button variant="outline" render={<Link href={`/cycles/${id}/export`} />}>
              <Download className="mr-2 h-4 w-4" />
              匯出
          </Button>
        </div>
      </div>

      {/* Controls */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Button onClick={() => setDrugSelectorOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增藥物
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => handleWeekChange(-1)}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">{cycle.total_weeks} 週</span>
            <Button variant="outline" size="icon" onClick={() => handleWeekChange(1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Cycle Drugs List */}
      {cycle.cycle_drugs && cycle.cycle_drugs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">已選藥物</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cycle.cycle_drugs.map((cd) => (
                <div key={cd.id} className="flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm">
                  <span className="font-medium">{cd.drug?.name}</span>
                  <span className="text-muted-foreground">
                    {cd.weekly_dose ? `${cd.weekly_dose}mg/wk` : `${cd.daily_dose}mg/day`}
                  </span>
                  <span className="text-muted-foreground">
                    W{cd.start_week}-{cd.end_week}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => removeCycleDrug.mutate({ id: cd.id, cycle_id: id })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <div className="rounded-md border bg-card">
        <ScheduleGrid
          totalWeeks={cycle.total_weeks}
          cells={displayCells}
          cycleDrugs={(cycle.cycle_drugs || []) as any}
          inventoryDeficits={inventoryDeficitsMap}
          isAdmin={isAdmin}
          onCellEdit={(cellKey, value, ml) => {
            setLocalOverrides((prev) => {
              const next = new Map(prev)
              next.set(cellKey, { value, ml })
              return next
            })
          }}
        />
      </div>

      {/* Inventory Summary */}
      <CalculationSummary deltas={inventoryDeltas} />

      {/* Drug Selector Dialog */}
      <DrugSelector
        open={drugSelectorOpen}
        onClose={() => setDrugSelectorOpen(false)}
        onAdd={handleAddDrug}
        totalWeeks={cycle.total_weeks}
      />
    </div>
  )
}
