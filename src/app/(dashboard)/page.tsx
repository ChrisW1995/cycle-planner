'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Pill, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalPeople: number
  totalDrugs: number
  totalCycles: number
  needsCycle: number
  lowStockDrugs: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPeople: 0,
    totalDrugs: 0,
    totalCycles: 0,
    needsCycle: 0,
    lowStockDrugs: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [people, drugs, cycles, needsCycle, lowStock] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('drugs').select('id', { count: 'exact', head: true }),
        supabase.from('cycles').select('id', { count: 'exact', head: true }),
        supabase.from('people').select('id', { count: 'exact', head: true }).eq('needs_cycle', true),
        supabase.from('drugs').select('id', { count: 'exact', head: true }).lte('inventory_count', 1),
      ])

      setStats({
        totalPeople: people.count || 0,
        totalDrugs: drugs.count || 0,
        totalCycles: cycles.count || 0,
        needsCycle: needsCycle.count || 0,
        lowStockDrugs: lowStock.count || 0,
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
