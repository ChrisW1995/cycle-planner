'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, CalendarPlus, Bell } from 'lucide-react'
import type { Person } from '@/types'
import Link from 'next/link'

interface PersonCardProps {
  person: Person
  isAdmin: boolean
  onDelete?: (id: string) => void
  onToggleNeedsCycle?: (id: string, needs: boolean) => void
}

export function PersonCard({ person, isAdmin, onDelete, onToggleNeedsCycle }: PersonCardProps) {
  return (
    <Link href={`/people/${person.id}`}>
      <Card className="relative group transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{person.nickname}</CardTitle>
              {person.needs_cycle && (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">
                  待排課表
                </Badge>
              )}
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.preventDefault()}
                  render={<Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    render={<Link href={`/cycles/new?personId=${person.id}`} />}
                  >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      新建課表
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleNeedsCycle?.(person.id, !person.needs_cycle)
                  }}>
                    <Bell className="mr-2 h-4 w-4" />
                    {person.needs_cycle ? '取消待排' : '標記待排'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onDelete?.(person.id)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {person.age && <span>年紀: {person.age}</span>}
            {person.height && <span>身高: {person.height}cm</span>}
            {person.weight && <span>體重: {person.weight}kg</span>}
            {person.body_fat && <span>體脂: {person.body_fat}%</span>}
          </div>
          {person.last_cycle_date && (
            <p className="text-xs text-muted-foreground">
              最近課表: {new Date(person.last_cycle_date).toLocaleDateString('zh-TW')}
            </p>
          )}
          {person.cycle_goal_notes && (
            <p className="text-xs text-muted-foreground truncate">
              目標: {person.cycle_goal_notes}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
