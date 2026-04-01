'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Person } from '@/types'

interface PersonFormProps {
  initialData?: Person
  onSubmit: (data: {
    nickname: string
    height: number | null
    weight: number | null
    body_fat: number | null
    age: number | null
  }) => void
  loading?: boolean
}

export function PersonForm({ initialData, onSubmit, loading }: PersonFormProps) {
  const [nickname, setNickname] = useState(initialData?.nickname || '')
  const [height, setHeight] = useState(initialData?.height?.toString() || '')
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '')
  const [bodyFat, setBodyFat] = useState(initialData?.body_fat?.toString() || '')
  const [age, setAge] = useState(initialData?.age?.toString() || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      nickname,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
      age: age ? parseInt(age) : null,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? '編輯人員' : '新增人員'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">暱稱 *</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入暱稱"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">身高 (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">體重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bodyFat">體脂 (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">年紀</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="28"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '儲存中...' : initialData ? '更新人員' : '新增人員'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
