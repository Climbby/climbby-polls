import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Poll, PollCategory } from '../lib/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<PollCategory[]> => {
      if (!supabase) return []

      const { data, error } = await supabase
        .from('poll_categories')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}

interface UsePollsOptions {
  status?: 'active' | 'closed'
  categorySlug?: string
}

export function usePolls({ status = 'active', categorySlug }: UsePollsOptions = {}) {
  return useQuery({
    queryKey: ['polls', status, categorySlug],
    queryFn: async (): Promise<Poll[]> => {
      if (!supabase) return []

      const categoryJoin = categorySlug ? 'poll_categories!inner(*)' : 'poll_categories(*)'

      let query = supabase
        .from('polls')
        .select(`*, ${categoryJoin}`)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (categorySlug) {
        query = query.eq('poll_categories.slug', categorySlug)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Poll[]
    },
  })
}
