'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/hooks/use-tenant'
import type { CycleSupply } from '@/types'
import { toast } from 'sonner'

const supabase = createClient()

// Sessions issued before the multi-tenant migration carry no tenant_id claim,
// so /api/auth/me returns tenant: null and writes that need tenant_id can't
// proceed. Surface a clear re-login prompt instead of a generic error.
const STALE_SESSION_MESSAGE = '請重新登入以套用多租戶設定'

export function useCycleSupplies(cycleId: string | undefined) {
  const { tenantId } = useTenant()
  return useQuery<CycleSupply[]>({
    queryKey: ['cycle-supplies', tenantId, cycleId],
    enabled: !!cycleId && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycle_supplies')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('cycle_id', cycleId!)
      if (error) throw error
      return data ?? []
    },
  })
}

export interface UpsertCycleSupplyInput {
  cycle_id: string
  supply_id: string
}

export function useUpsertCycleSupply() {
  const qc = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: async (input: UpsertCycleSupplyInput): Promise<CycleSupply> => {
      if (!tenantId) throw new Error(STALE_SESSION_MESSAGE)
      const { data, error } = await supabase
        .from('cycle_supplies')
        .upsert(
          { cycle_id: input.cycle_id, supply_id: input.supply_id, tenant_id: tenantId },
          { onConflict: 'cycle_id,supply_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data as CycleSupply
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['cycle-supplies', tenantId, vars.cycle_id], refetchType: 'all' }),
    onError: (error) => toast.error('用具勾選失敗', { description: error.message }),
  })
}

export function useDeleteCycleSupply() {
  const qc = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: async (input: { cycle_id: string; supply_id: string }) => {
      if (!tenantId) throw new Error(STALE_SESSION_MESSAGE)
      const { error } = await supabase
        .from('cycle_supplies')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('cycle_id', input.cycle_id)
        .eq('supply_id', input.supply_id)
      if (error) throw error
      return input
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['cycle-supplies', tenantId, vars.cycle_id], refetchType: 'all' }),
    onError: (error) => toast.error('用具取消失敗', { description: error.message }),
  })
}
