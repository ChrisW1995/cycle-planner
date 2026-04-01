'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Pencil } from 'lucide-react'
import type { CycleCell, CycleDrug, Drug } from '@/types'
import { getExpectedMl } from '@/lib/calculations/schedule-engine'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

interface CycleDrugWithDrug extends CycleDrug {
  drug: Drug
}

interface ScheduleGridProps {
  totalWeeks: number
  cells: CycleCell[]
  cycleDrugs: CycleDrugWithDrug[]
  inventoryDeficits: Map<string, number> // drug_id → deficit (negative = shortage)
  isAdmin: boolean
  onCellEdit?: (cellKey: string, value: string, mlAmount: number | null) => void
}

export function ScheduleGrid({
  totalWeeks,
  cells,
  cycleDrugs,
  inventoryDeficits,
  isAdmin,
  onCellEdit,
}: ScheduleGridProps) {
  // Group cells by week+day
  const cellMap = useMemo(() => {
    const map = new Map<string, CycleCell[]>()
    for (const cell of cells) {
      const key = `${cell.week_number}-${cell.day_of_week}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(cell)
    }
    return map
  }, [cells])

  // Build expected ml map for validation
  const expectedMlMap = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const cd of cycleDrugs) {
      map.set(cd.id, getExpectedMl(cd as any))
    }
    return map
  }, [cycleDrugs])

  // Drugs with inventory issues
  const lowInventoryDrugIds = useMemo(() => {
    const ids = new Set<string>()
    inventoryDeficits.forEach((deficit, drugId) => {
      if (deficit < 0) ids.add(drugId)
    })
    return ids
  }, [inventoryDeficits])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card border border-border px-3 py-2 text-left font-medium min-w-[80px]">
              Week
            </th>
            {DAY_LABELS.map((day, i) => (
              <th
                key={i}
                className="border border-border px-3 py-2 text-center font-medium min-w-[140px]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalWeeks }, (_, weekIdx) => {
            const weekNum = weekIdx + 1
            return (
              <tr key={weekNum}>
                <td className="sticky left-0 z-10 bg-card border border-border px-3 py-2 font-medium text-muted-foreground">
                  Week {weekNum}
                </td>
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const dayNum = dayIdx + 1
                  const key = `${weekNum}-${dayNum}`
                  const dayCells = cellMap.get(key) || []

                  return (
                    <ScheduleCell
                      key={key}
                      cellKey={key}
                      cells={dayCells}
                      cycleDrugs={cycleDrugs}
                      expectedMlMap={expectedMlMap}
                      lowInventoryDrugIds={lowInventoryDrugIds}
                      isAdmin={isAdmin}
                      onEdit={onCellEdit}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface ScheduleCellProps {
  cellKey: string
  cells: CycleCell[]
  cycleDrugs: CycleDrugWithDrug[]
  expectedMlMap: Map<string, number | null>
  lowInventoryDrugIds: Set<string>
  isAdmin: boolean
  onEdit?: (cellKey: string, value: string, mlAmount: number | null) => void
}

function ScheduleCell({
  cellKey,
  cells,
  cycleDrugs,
  expectedMlMap,
  lowInventoryDrugIds,
  isAdmin,
  onEdit,
}: ScheduleCellProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editMl, setEditMl] = useState('')

  const hasCells = cells.length > 0

  // Check for issues in this cell
  const hasInventoryWarning = cells.some((c) => {
    const cd = cycleDrugs.find((d) => d.id === c.cycle_drug_id)
    return cd && lowInventoryDrugIds.has(cd.drug_id)
  })

  const hasMlMismatch = cells.some((c) => {
    if (!c.is_manual_override || c.ml_amount == null) return false
    const expected = expectedMlMap.get(c.cycle_drug_id)
    return expected != null && Math.abs(c.ml_amount - expected) > 0.001
  })

  return (
    <td
      className={cn(
        'border border-border px-2 py-1.5 align-top min-h-[60px] transition-colors',
        hasInventoryWarning && 'bg-red-500/5',
        hasMlMismatch && 'bg-yellow-500/10',
        !hasCells && 'bg-transparent'
      )}
    >
      <div className="space-y-0.5">
        {cells.map((cell, i) => (
          <div
            key={cell.id || `${cellKey}-${i}`}
            className={cn(
              'text-xs leading-tight',
              cell.is_manual_override && 'text-yellow-500',
              hasInventoryWarning && 'text-red-400'
            )}
          >
            {cell.display_value}
          </div>
        ))}
      </div>
      {hasCells && isAdmin && (
        <Popover open={editOpen} onOpenChange={setEditOpen}>
          <PopoverTrigger
            render={<button className="mt-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
          >
              <Pencil className="h-3 w-3" />
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-xs font-medium">編輯格子</p>
              <Input
                placeholder="顯示文字"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-xs"
              />
              <Input
                placeholder="ml 數值"
                type="number"
                step="any"
                value={editMl}
                onChange={(e) => setEditMl(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onEdit?.(cellKey, editValue, editMl ? parseFloat(editMl) : null)
                  setEditOpen(false)
                }}
              >
                確認
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </td>
  )
}
