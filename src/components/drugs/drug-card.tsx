'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InventoryBadge } from './inventory-badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Drug } from '@/types'
import Link from 'next/link'

interface DrugCardProps {
  drug: Drug
  isAdmin: boolean
  onDelete?: (id: string) => void
}

const categoryColors: Record<string, string> = {
  Injectable: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Oral: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  PCT: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
}

export function DrugCard({ drug, isAdmin, onDelete }: DrugCardProps) {
  return (
    <Card className="relative group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{drug.name}</CardTitle>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />}
              >
                  <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/drugs/${drug.id}/edit`} />}>
                    <Pencil className="mr-2 h-4 w-4" />
                    編輯
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(drug.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  刪除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge variant="outline" className={categoryColors[drug.primary_category] || ''}>
            {drug.primary_category}
          </Badge>
          {drug.sub_category && (
            <Badge variant="secondary" className="text-xs">{drug.sub_category}</Badge>
          )}
          {drug.ester_type && (
            <Badge variant="secondary" className="text-xs">
              {drug.ester_type === 'Long' ? '長效' : '短效'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {drug.brand && (
          <p className="text-sm text-muted-foreground">
            廠牌: <span className="font-medium text-foreground">{drug.brand}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          濃度: <span className="font-medium text-foreground">{drug.concentration} mg/ml</span>
        </p>
        <InventoryBadge count={drug.inventory_count} />
      </CardContent>
    </Card>
  )
}
