'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusLabels } from '@/lib/constants/cycle-status'
import { Users, Pill, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { CycleStatus } from '@/types'

interface DashboardStats {
  totalPeople: number
  totalDrugs: number
  totalCycles: number
  needsCycle: number
  lowStockDrugs: number
  cyclesByStatus: Record<string, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPeople: 0,
    totalDrugs: 0,
    totalCycles: 0,
    needsCycle: 0,
    lowStockDrugs: 0,
    cyclesByStatus: {},
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [people, drugs, cycles, needsCycle, lowStock, cycleStatuses] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('drugs').select('id', { count: 'exact', head: true }),
        supabase.from('cycles').select('id', { count: 'exact', head: true }),
        supabase.from('people').select('id', { count: 'exact', head: true }).eq('needs_cycle', true),
        supabase.from('drugs').select('id', { count: 'exact', head: true }).lte('inventory_count', 1),
        supabase.from('cycles').select('status'),
      ])

      const byStatus: Record<string, number> = {}
      if (cycleStatuses.data) {
        for (const row of cycleStatuses.data) {
          byStatus[row.status] = (byStatus[row.status] || 0) + 1
        }
      }

      setStats({
        totalPeople: people.count || 0,
        totalDrugs: drugs.count || 0,
        totalCycles: cycles.count || 0,
        needsCycle: needsCycle.count || 0,
        lowStockDrugs: lowStock.count || 0,
        cyclesByStatus: byStatus,
      })
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: '人員總數',
      value: stats.totalPeople,
      icon: Users,
      href: '/people',
      color: 'text-blue-500',
    },
    {
      title: '藥物品項',
      value: stats.totalDrugs,
      icon: Pill,
      href: '/drugs',
      color: 'text-green-500',
    },
    {
      title: '課表總數',
      value: stats.totalCycles,
      icon: Calendar,
      href: '/cycles',
      color: 'text-purple-500',
    },
    {
      title: '待安排課表',
      value: stats.needsCycle,
      icon: AlertTriangle,
      href: '/people?filter=needs_cycle',
      color: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">總覽</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
                {card.title === '課表總數' && stats.totalCycles > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {(['Scheduled', 'Planned', 'Completed'] as CycleStatus[]).map((s) => {
                      const count = stats.cyclesByStatus[s] || 0
                      if (count === 0) return null
                      return (
                        <span key={s}>
                          <span className={
                            s === 'Scheduled' ? 'text-blue-500' :
                            s === 'Planned' ? 'text-amber-500' :
                            'text-green-500'
                          }>{statusLabels[s]}</span>
                          {' '}{count}
                        </span>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {stats.lowStockDrugs > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              庫存不足提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              有 {stats.lowStockDrugs} 項藥品庫存不足，
              <Link href="/drugs?filter=low_stock" className="text-primary underline">
                前往查看
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
