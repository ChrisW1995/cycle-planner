'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateCycle } from '@/hooks/use-cycles'
import { usePeople } from '@/hooks/use-people'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function NewCycleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPersonId = searchParams.get('personId') || ''
  const { data: people } = usePeople()
  const createCycle = useCreateCycle()

  const [personId, setPersonId] = useState(preselectedPersonId)
  const [name, setName] = useState('')
  const [totalWeeks, setTotalWeeks] = useState('12')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createCycle.mutate(
      {
        person_id: personId,
        name: name || null,
        total_weeks: parseInt(totalWeeks),
        status: 'Scheduled',
        start_date: startDate || null,
        notes: notes || null,
      },
      {
        onSuccess: (data) => router.push(`/cycles/${data.id}`),
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>新建課表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>人員 *</Label>
              <Select value={personId} onValueChange={(v: string | null) => v && setPersonId(v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="選擇人員...">
                    {(value: string | null) => {
                      if (!value) return null
                      return people?.find(p => p.id === value)?.nickname ?? value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {people?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">課表名稱</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：增肌期 Cycle 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeks">總週數</Label>
                <Input
                  id="weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="課表目標、注意事項..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!personId || createCycle.isPending}>
              {createCycle.isPending ? '建立中...' : '建立課表'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewCyclePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>}>
      <NewCycleForm />
    </Suspense>
  )
}
