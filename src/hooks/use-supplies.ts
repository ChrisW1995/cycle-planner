'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Supply, SupplyRuleType } from '@/types'

const supabase = createClient()

export function useSupplies() {
  return useQuery<Supply[]>({
    queryKey: ['supplies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export interface SupplyInput {
  name: string
  unit: string
  rule_type: SupplyRuleType
  rule_value: number
  display_order?: number
}

export function useCreateSupply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplyInput): Promise<Supply> => {
      const { data, error } = await supabase
        .from('supplies')
        .insert({ ...input, is_system: false })
        .select()
        .single()
      if (error) throw error
      return data as Supply
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'], refetchType: 'all' }),
  })
}

export function useUpdateSupply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: SupplyInput & { id: string }): Promise<Supply> => {
      const { data, error } = await supabase
        .from('supplies')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Supply
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'], refetchType: 'all' }),
  })
}

export function useDeleteSupply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplies').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'], refetchType: 'all' }),
  })
}

// Re-number display_order with gaps of 10 so future single-item moves can squeeze in.
export function useReorderSupplies() {
  const qc = useQueryClient()
  return useMutation<void, Error, string[], { previous?: Supply[] }>({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) => ({ id, display_order: (idx + 1) * 10 }))
      const results = await Promise.all(
        updates.map((u) =>
          supabase
            .from('supplies')
            .update({ display_order: u.display_order, updated_at: new Date().toISOString() })
            .eq('id', u.id)
        )
      )
      const firstError = results.find((r) => r.error)?.error
      if (firstError) throw firstError
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: ['supplies'] })
      const previous = qc.getQueryData<Supply[]>(['supplies'])
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]))
        const reordered = orderedIds
          .map((id, idx) => {
            const s = byId.get(id)
            return s ? { ...s, display_order: (idx + 1) * 10 } : null
          })
          .filter((x): x is Supply => x !== null)
        qc.setQueryData(['supplies'], reordered)
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['supplies'], ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['supplies'] }),
  })
}
