'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Drug, DrugTemplate, DrugFormData } from '@/types'
import { toast } from 'sonner'

const supabase = createClient()

export function useDrugTemplates() {
  return useQuery<DrugTemplate[]>({
    queryKey: ['drug-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drug_templates')
        .select('*')
        .order('primary_category')
        .order('sub_category')
        .order('short_name')
      if (error) throw error
      return data
    },
  })
}

export function useBrandSuggestions() {
  return useQuery<string[]>({
    queryKey: ['brand-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drugs')
        .select('brand')
        .not('brand', 'is', null)
        .order('brand')
      if (error) throw error
      return [...new Set(data?.map(d => d.brand).filter(Boolean))] as string[]
    },
  })
}

export function useDrugs() {
  return useQuery<Drug[]>({
    queryKey: ['drugs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drugs')
        .select('*, template:drug_templates(*)')
        .order('primary_category')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useDrug(id: string) {
  return useQuery<Drug>({
    queryKey: ['drugs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drugs')
        .select('*, template:drug_templates(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDrug() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (drug: Omit<DrugFormData, 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('drugs')
        .insert(drug)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] })
      toast.success('藥品已新增')
    },
    onError: (error) => {
      toast.error('新增失敗', { description: error.message })
    },
  })
}

export function useUpdateDrug() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...drug }: Partial<Drug> & { id: string }) => {
      const { data, error } = await supabase
        .from('drugs')
        .update(drug)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] })
      queryClient.invalidateQueries({ queryKey: ['drugs', data.id] })
      toast.success('藥品已更新')
    },
    onError: (error) => {
      toast.error('更新失敗', { description: error.message })
    },
  })
}

export function useDeleteDrug() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drugs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] })
      toast.success('藥品已刪除')
    },
    onError: (error) => {
      toast.error('刪除失敗', { description: error.message })
    },
  })
}
