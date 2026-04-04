'use client'

import { useState, Suspense } from 'react'
import { usePeople, useDeletePerson, useToggleNeedsCycle } from '@/hooks/use-people'
import { useAuth } from '@/hooks/use-auth'
import { PersonCard } from '@/components/people/person-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import { statusColors, statusLabels } from '@/lib/constants/cycle-status'
import type { CycleStatus } from '@/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>}>
      <PeopleContent />
    </Suspense>
  )
}

function PeopleContent() {
  const { data: people, isLoading } = usePeople()
  const deletePerson = useDeletePerson()
  const toggleNeedsCycle = useToggleNeedsCycle()
  const { isAdmin } = useAuth()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('people-view-mode') as 'grid' | 'list') || 'grid'
    }
    return 'grid'
  })
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [needsCycleTarget, setNeedsCycleTarget] = useState<{ id: string; needs: boolean } | null>(null)
  const [cycleGoalNotes, setCycleGoalNotes] = useState('')

  const filterNeedsCycle = searchParams.get('filter') === 'needs_cycle'

  const filtered = people?.filter((p) => {
    const matchSearch = p.nickname.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterNeedsCycle ? p.needs_cycle : true
    return matchSearch && matchFilter
  })

  const handleDelete = () => {
    if (deleteTarget) {
      deletePerson.mutate(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const handleToggleNeedsCycle = (id: string, needs: boolean) => {
    if (needs) {
      // Show dialog to add notes
      setNeedsCycleTarget({ id, needs })
      setCycleGoalNotes('')
    } else {
      toggleNeedsCycle.mutate({ id, needs_cycle: false, cycle_goal_notes: null })
    }
  }

  const confirmNeedsCycle = () => {
    if (needsCycleTarget) {
      toggleNeedsCycle.mutate({
        id: needsCycleTarget.id,
        needs_cycle: true,
        cycle_goal_notes: cycleGoalNotes || null,
      })
      setNeedsCycleTarget(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          人員管理
          {filterNeedsCycle && <span className="text-amber-500 ml-2 text-lg">（待排課表）</span>}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => { setViewMode('grid'); localStorage.setItem('people-view-mode', 'grid') }}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => { setViewMode('list'); localStorage.setItem('people-view-mode', 'list') }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Button render={<Link href="/people/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                新增人員
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋暱稱..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered?.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          {people?.length === 0 ? '尚未新增任何人員' : '沒有符合搜尋的結果'}
        </p>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered?.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              isAdmin={isAdmin}
              onDelete={setDeleteTarget}
              onToggleNeedsCycle={handleToggleNeedsCycle}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>暱稱</TableHead>
                <TableHead>年紀</TableHead>
                <TableHead>身高</TableHead>
                <TableHead>體重</TableHead>
                <TableHead>體脂</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.nickname}</TableCell>
                  <TableCell>{person.age || '—'}</TableCell>
                  <TableCell>{person.height ? `${person.height}cm` : '—'}</TableCell>
                  <TableCell>{person.weight ? `${person.weight}kg` : '—'}</TableCell>
                  <TableCell>{person.body_fat ? `${person.body_fat}%` : '—'}</TableCell>
                  <TableCell>
                    {person.needs_cycle ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">待排課表</Badge>
                    ) : (() => {
                      const latest = person.cycles?.length
                        ? [...person.cycles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                        : null
                      return latest ? (
                        <Badge variant="outline" className={`${statusColors[latest.status as CycleStatus]} text-xs`}>
                          {statusLabels[latest.status as CycleStatus]}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>
                    })()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" render={<Link href={`/people/${person.id}`} />}>
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作會同時刪除該人員的所有課表，確定嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Needs Cycle Notes Dialog */}
      <Dialog open={!!needsCycleTarget} onOpenChange={() => setNeedsCycleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>標記待排課表</DialogTitle>
            <DialogDescription>可以備註本次 Cycle 的目標</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Cycle 目標備註（選填）</Label>
            <Textarea
              value={cycleGoalNotes}
              onChange={(e) => setCycleGoalNotes(e.target.value)}
              placeholder="例如：增肌期、備賽減脂..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeedsCycleTarget(null)}>取消</Button>
            <Button onClick={confirmNeedsCycle}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
