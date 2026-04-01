'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Person, PersonFormData } from '@/types'
import { toast } from 'sonner'

const supabase = createClient()

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          cycles(id, status, start_date, created_at)
        `)
        .order('nickname')
      if (error) throw error
      // Compute last_cycle_date
      return data.map((p: any) => ({
        ...p,
        last_cycle_date: p.cycles?.length
          ? p.cycles.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.start_date || p.cycles[0]?.created_at
          : null,
      }))
    },
  })
}

export function usePerson(id: string) {
  return useQuery<Person>({
    queryKey: ['people', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          cycles(
            id, name, total_weeks, status, start_date, notes, created_at, updated_at,
            cycle_drugs(
              id, drug_id, weekly_dose, daily_dose, start_week, end_week,
              drug:drugs(id, name, concentration, primary_category, ester_type)
            )
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return {
        ...data,
        cycles: data.cycles?.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }
    },
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (person: Omit<PersonFormData, 'needs_cycle' | 'cycle_goal_notes'> & { needs_cycle?: boolean; cycle_goal_notes?: string | null }) => {
      const { data, error } = await supabase.from('people').insert(person).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      toast.success('人員已新增')
    },
    onError: (error) => toast.error('新增失敗', { description: error.message }),
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...person }: Partial<Person> & { id: string }) => {
      const { data, error } = await supabase.from('people').update(person).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['people', data.id] })
      toast.success('人員已更新')
    },
    onError: (error) => toast.error('更新失敗', { description: error.message }),
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('people').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      toast.success('人員已刪除')
    },
    onError: (error) => toast.error('刪除失敗', { description: error.message }),
  })
}

export function useToggleNeedsCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, needs_cycle, cycle_goal_notes }: { id: string; needs_cycle: boolean; cycle_goal_notes?: string | null }) => {
      const { error } = await supabase.from('people').update({ needs_cycle, cycle_goal_notes }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}
