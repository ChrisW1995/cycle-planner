'use client'

import { useState } from 'react'
import { useDrugTemplates, useBrandSuggestions } from '@/hooks/use-drugs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Drug, DrugTemplate, PrimaryCategory, SubCategory, EsterType } from '@/types'

interface DrugFormProps {
  initialData?: Drug
  onSubmit: (data: {
    template_id: string | null
    name: string
    concentration: number
    primary_category: PrimaryCategory
    sub_category: SubCategory | null
    ester_type: EsterType | null
    brand: string | null
    inventory_count: number
    image_url: string | null
  }) => void
  loading?: boolean
}

const primaryCategories: PrimaryCategory[] = ['Injectable', 'Oral', 'PCT']
const subCategories: SubCategory[] = ['Test', 'Nor-19', 'DHT', 'AI', 'SERM', 'Prolactin', 'Other']
const esterTypes: EsterType[] = ['Long', 'Short']

export function DrugForm({ initialData, onSubmit, loading }: DrugFormProps) {
  const { data: templates } = useDrugTemplates()
  const { data: existingBrands } = useBrandSuggestions()
  const [selectedTemplate, setSelectedTemplate] = useState<DrugTemplate | null>(null)
  const [name, setName] = useState(initialData?.name || '')
  const [brand, setBrand] = useState(initialData?.brand || '')
  const [concentration, setConcentration] = useState(initialData?.concentration?.toString() || '')
  const [primaryCategory, setPrimaryCategory] = useState<PrimaryCategory>(initialData?.primary_category || 'Injectable')
  const [subCategory, setSubCategory] = useState<SubCategory | null>(initialData?.sub_category || null)
  const [esterType, setEsterType] = useState<EsterType | null>(initialData?.ester_type || null)
  const [inventoryCount, setInventoryCount] = useState(initialData?.inventory_count?.toString() || '0')
  const [mode, setMode] = useState<'template' | 'custom'>(initialData ? 'custom' : 'template')

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId)
    if (!template) return
    setSelectedTemplate(template)
    setName(`${template.short_name} ${template.default_concentration || ''}`.trim())
    setConcentration(template.default_concentration?.toString() || '')
    setPrimaryCategory(template.primary_category)
    setSubCategory(template.sub_category)
    setEsterType(template.ester_type)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      template_id: selectedTemplate?.id || initialData?.template_id || null,
      name,
      concentration: parseFloat(concentration),
      primary_category: primaryCategory,
      sub_category: subCategory,
      ester_type: esterType,
      brand: brand.trim() || null,
      inventory_count: parseInt(inventoryCount) || 0,
      image_url: initialData?.image_url || null,
    })
  }

  // Group templates by category
  const groupedTemplates = templates?.reduce((acc, t) => {
    const key = `${t.primary_category} - ${t.sub_category || 'Other'}`
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {} as Record<string, DrugTemplate[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? '編輯藥品' : '新增藥品'}</CardTitle>
        {!initialData && (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant={mode === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('template')}
            >
              從模板選擇
            </Button>
            <Button
              type="button"
              variant={mode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('custom')}
            >
              自訂藥品
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template selector */}
          {mode === 'template' && !initialData && (
            <div className="space-y-2">
              <Label>選擇藥物模板</Label>
              <Select onValueChange={(v: string | null) => v && handleTemplateSelect(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇藥物...">
                    {(value: string | null) => {
                      if (!value) return '選擇藥物...'
                      const t = templates?.find(tmpl => tmpl.id === value)
                      return t ? `${t.short_name} — ${t.generic_name}${t.default_concentration ? ` (${t.default_concentration}${t.default_unit})` : ''}` : String(value)
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groupedTemplates && Object.entries(groupedTemplates).map(([group, items]) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {items.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.short_name} — {t.generic_name}
                          {t.default_concentration ? ` (${t.default_concentration}${t.default_unit})` : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">藥品名稱 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TestE 300"
              required
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">廠牌</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Alpha Pharma"
              list="brand-suggestions"
            />
            <datalist id="brand-suggestions">
              {[...new Set([
                ...(existingBrands || []),
                ...(selectedTemplate?.brand_names || []),
              ])].map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              選填，建議從清單中選擇以保持名稱一致性
            </p>
          </div>

          {/* Concentration */}
          <div className="space-y-2">
            <Label htmlFor="concentration">濃度/劑量 *</Label>
            <Input
              id="concentration"
              type="number"
              step="any"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              placeholder="e.g. 300"
              required
            />
            <p className="text-xs text-muted-foreground">
              注射劑: mg/ml | 口服: mg/tab | 其他: mcg/tab 或 IU/vial
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Primary Category */}
            <div className="space-y-2">
              <Label>主要分類 *</Label>
              <Select value={primaryCategory} onValueChange={(v: string | null) => v && setPrimaryCategory(v as PrimaryCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {primaryCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Category */}
            <div className="space-y-2">
              <Label>次分類</Label>
              <Select value={subCategory || 'none'} onValueChange={(v: string | null) => v && setSubCategory(v === 'none' ? null : v as SubCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="選填" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">無</SelectItem>
                  {subCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ester Type (Injectable only) */}
          {primaryCategory === 'Injectable' && (
            <div className="space-y-2">
              <Label>酯類（注射頻率）</Label>
              <Select value={esterType || 'none'} onValueChange={(v: string | null) => v && setEsterType(v === 'none' ? null : v as EsterType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">無</SelectItem>
                  <SelectItem value="Long">Long（長效 — 每週 2 次）</SelectItem>
                  <SelectItem value="Short">Short（短效 — 每隔一天）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Inventory */}
          <div className="space-y-2">
            <Label htmlFor="inventory">庫存數量</Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              value={inventoryCount}
              onChange={(e) => setInventoryCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              注射劑: 瓶數（每瓶 10ml）| 口服: 盒/板數
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '儲存中...' : initialData ? '更新藥品' : '新增藥品'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
