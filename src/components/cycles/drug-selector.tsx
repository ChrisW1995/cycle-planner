'use client'

import { useState } from 'react'
import { useDrugs } from '@/hooks/use-drugs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Drug } from '@/types'

interface DrugSelectorProps {
  open: boolean
  onClose: () => void
  onAdd: (data: {
    drug_id: string
    weekly_dose?: number
    daily_dose?: number
    start_week: number
    end_week: number
  }) => void
  totalWeeks: number
  existingDrugIds?: string[] // drugs already in cycle (for short ester overlap warning)
}

export function DrugSelector({ open, onClose, onAdd, totalWeeks, existingDrugIds }: DrugSelectorProps) {
  const { data: drugs } = useDrugs()
  const [selectedDrugId, setSelectedDrugId] = useState('')
  const [weeklyDose, setWeeklyDose] = useState('')
  const [dailyDose, setDailyDose] = useState('')
  const [startWeek, setStartWeek] = useState('1')
  const [endWeek, setEndWeek] = useState(totalWeeks.toString())

  const selectedDrug = drugs?.find((d) => d.id === selectedDrugId)
  const isInjectable = selectedDrug?.primary_category === 'Injectable'
  const isOral = selectedDrug?.primary_category === 'Oral' || selectedDrug?.primary_category === 'PCT'

  const handleAdd = () => {
    if (!selectedDrugId) return

    onAdd({
      drug_id: selectedDrugId,
      weekly_dose: isInjectable ? parseFloat(weeklyDose) || undefined : undefined,
      daily_dose: isOral ? parseFloat(dailyDose) || undefined : undefined,
      start_week: parseInt(startWeek),
      end_week: parseInt(endWeek),
    })

    // Reset
    setSelectedDrugId('')
    setWeeklyDose('')
    setDailyDose('')
    setStartWeek('1')
    setEndWeek(totalWeeks.toString())
    onClose()
  }

  // Calculate preview
  let preview = ''
  if (selectedDrug && isInjectable && weeklyDose) {
    const dose = parseFloat(weeklyDose)
    if (selectedDrug.ester_type === 'Long') {
      const ml = Math.round((dose / 2 / selectedDrug.concentration) * 100) / 100
      preview = `每次注射 ${ml}ml (Day 1 & Day 4)`
    } else if (selectedDrug.ester_type === 'Short') {
      const ml = Math.round((dose / 3.5 / selectedDrug.concentration) * 100) / 100
      preview = `每次注射 ${ml}ml (隔日，跨兩週交替)`
    }
  }
  if (selectedDrug && isOral && dailyDose) {
    const tabs = Math.round((parseFloat(dailyDose) / selectedDrug.concentration) * 10) / 10
    preview = `每日 ${dailyDose}mg (${tabs} 顆/天)`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增藥物至課表</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>選擇藥物 *</Label>
            <Select value={selectedDrugId} onValueChange={(v: string | null) => v && setSelectedDrugId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="選擇庫存中的藥物..." />
              </SelectTrigger>
              <SelectContent>
                {drugs?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.primary_category}{d.ester_type ? ` - ${d.ester_type === 'Long' ? '長效' : '短效'}` : ''})
                    {d.inventory_count <= 1 ? ' ⚠️' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isInjectable && (
            <div className="space-y-2">
              <Label>每週劑量 (mg/週) *</Label>
              <Input
                type="number"
                step="any"
                value={weeklyDose}
                onChange={(e) => setWeeklyDose(e.target.value)}
                placeholder="e.g. 360"
              />
            </div>
          )}

          {isOral && (
            <div className="space-y-2">
              <Label>每日劑量 (mg/天) *</Label>
              <Input
                type="number"
                step="any"
                value={dailyDose}
                onChange={(e) => setDailyDose(e.target.value)}
                placeholder="e.g. 40"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>開始週</Label>
              <Input
                type="number"
                min="1"
                max={totalWeeks}
                value={startWeek}
                onChange={(e) => setStartWeek(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>結束週</Label>
              <Input
                type="number"
                min="1"
                max={totalWeeks}
                value={endWeek}
                onChange={(e) => setEndWeek(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">預覽：</p>
              <p className="text-muted-foreground">{preview}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleAdd} disabled={!selectedDrugId || (isInjectable && !weeklyDose) || (isOral && !dailyDose)}>
            新增
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
