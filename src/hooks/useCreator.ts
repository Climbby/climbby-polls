import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Creator, CreatorDashboard } from '../lib/types'
import { useAuth } from './useAuth'

export function useCreatorBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['creator', slug],
    queryFn: async (): Promise<Creator | null> => {
      if (!supabase || !slug) return null

      const { data, error } = await supabase.rpc('get_creator_by_slug', {
        slug_input: slug,
      })

      if (error) throw error
      const row = data?.[0]
      return row ? (row as Creator) : null
    },
    enabled: Boolean(slug),
  })
}

export function useMyCreator() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['creator', 'mine'],
    queryFn: async (): Promise<CreatorDashboard | null> => {
      if (!supabase) return null

      const { data, error } = await supabase.rpc('get_my_creator')
      if (error) throw error
      const row = data?.[0]
      if (!row) return null
      return {
        ...(row as CreatorDashboard),
        active_polls: Number(row.active_polls ?? 0),
        closed_polls: Number(row.closed_polls ?? 0),
        total_votes: Number(row.total_votes ?? 0),
      }
    },
    enabled: Boolean(user),
  })
}

export function useSlugAvailability(slug: string) {
  return useQuery({
    queryKey: ['creator-slug-available', slug],
    queryFn: async (): Promise<boolean> => {
      if (!supabase || !slug) return false
      const { data, error } = await supabase.rpc('is_creator_slug_available', {
        slug_input: slug,
      })
      if (error) throw error
      return Boolean(data)
    },
    enabled: slug.length >= 2,
  })
}

export function useClaimCreatorPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slug,
      displayName,
    }: {
      slug: string
      displayName: string
    }) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase.rpc('claim_creator_page', {
        slug_input: slug,
        display_name_input: displayName,
      })

      if (error) throw error
      return data as { creator_id: string; slug: string; display_name: string }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator'] })
    },
  })
}
