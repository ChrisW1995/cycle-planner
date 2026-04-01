'use client'

import { useState } from 'react'
import { useDrugs, useDeleteDrug } from '@/hooks/use-drugs'
import { useAuth } from '@/hooks/use-auth'
import { DrugCard } from '@/components/drugs/drug-card'
import { InventoryBadge } from '@/components/drugs/inventory-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import Link from 'next/link'
import type { Drug } from '@/types'

export default function DrugsPage() {
  const { data: drugs, isLoading } = useDrugs()
  const deleteDrug = useDeleteDrug()
  const { isAdmin } = useAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = drugs?.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.primary_category.toLowerCase().includes(search.toLowerCase()) ||
    d.sub_category?.toLowerCase().includes(search.toLowerCase()) ||
    d.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = filtered?.filter((d) => d.inventory_count <= 1) || []
  const normalStock = filtered?.filter((d) => d.inventory_count > 1) || []

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDrug.mutate(deleteTarget)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">藥物庫存</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Button render={<Link href="/drugs/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                新增藥品
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋藥品名稱、分類..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Low Stock Section */}
      {lowStock.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-500">
            庫存不足 ({lowStock.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lowStock.map((drug) => (
                <DrugCard key={drug.id} drug={drug} isAdmin={isAdmin} onDelete={setDeleteTarget} />
              ))}
            </div>
          ) : (
            <DrugTable drugs={lowStock} isAdmin={isAdmin} onDelete={setDeleteTarget} />
          )}
        </section>
      )}

      {/* Normal Stock Section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-green-500">
          庫存正常 ({normalStock.length})
        </h2>
        {normalStock.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {drugs?.length === 0 ? '尚未新增任何藥品' : '沒有符合搜尋的結果'}
          </p>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {normalStock.map((drug) => (
              <DrugCard key={drug.id} drug={drug} isAdmin={isAdmin} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <DrugTable drugs={normalStock} isAdmin={isAdmin} onDelete={setDeleteTarget} />
        )}
      </section>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作無法復原，確定要刪除此藥品嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DrugTable({ drugs, isAdmin, onDelete }: { drugs: Drug[]; isAdmin: boolean; onDelete: (id: string) => void }) {
  const categoryColors: Record<string, string> = {
    Injectable: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    Oral: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    PCT: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>廠牌</TableHead>
            <TableHead>分類</TableHead>
            <TableHead>濃度</TableHead>
            <TableHead>酯類</TableHead>
            <TableHead>庫存</TableHead>
            {isAdmin && <TableHead className="w-20">操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {drugs.map((drug) => (
            <TableRow key={drug.id}>
              <TableCell className="font-medium">{drug.name}</TableCell>
              <TableCell className="text-muted-foreground">{drug.brand || '—'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Badge variant="outline" className={categoryColors[drug.primary_category] || ''}>
                    {drug.primary_category}
                  </Badge>
                  {drug.sub_category && (
                    <Badge variant="secondary" className="text-xs">{drug.sub_category}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{drug.concentration}</TableCell>
              <TableCell>{drug.ester_type === 'Long' ? '長效' : drug.ester_type === 'Short' ? '短效' : '—'}</TableCell>
              <TableCell><InventoryBadge count={drug.inventory_count} /></TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" render={<Link href={`/drugs/${drug.id}/edit`} />}>
                      編輯
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(drug.id)}>
                      刪除
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
