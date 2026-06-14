import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { AdminPollRow, CreatePollInput, PollComment, PollStatus } from '../lib/types'
import { useAuth } from './useAuth'

export function useCreatorPolls() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['creator-manage', 'polls'],
    queryFn: async (): Promise<AdminPollRow[]> => {
      if (!supabase) return []

      const { data, error } = await supabase.rpc('creator_list_polls')
      if (error) throw error
      return (data ?? []) as AdminPollRow[]
    },
    enabled: Boolean(user),
  })
}

export function useCreatorComments(pollId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['creator-manage', 'comments', pollId],
    queryFn: async (): Promise<PollComment[]> => {
      if (!supabase || !pollId) return []

      const { data, error } = await supabase
        .from('poll_comments')
        .select('id, poll_id, author_name, body, option_id, is_creator, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map((row) => ({
        ...row,
        is_creator: Boolean(row.is_creator),
      }))
    },
    enabled: Boolean(user && pollId),
  })
}

export function useCreatorCreatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePollInput) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase.rpc('creator_create_poll', {
        slug_input: input.slug,
        title_input: input.title,
        description_input: input.description || null,
        category_id_input: input.categoryId,
        allow_comments_input: input.allowComments,
        status_input: input.status,
        options_input: input.options,
      })

      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['creator-manage'] })
      void queryClient.invalidateQueries({ queryKey: ['creator'] })
    },
  })
}

export function useCreatorSetPollStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pollId, status }: { pollId: string; status: PollStatus }) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('creator_set_poll_status', {
        poll_id_input: pollId,
        status_input: status,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['creator-manage'] })
      void queryClient.invalidateQueries({ queryKey: ['creator'] })
    },
  })
}

export function useCreatorDeletePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('creator_delete_poll', {
        poll_id_input: pollId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['creator-manage'] })
      void queryClient.invalidateQueries({ queryKey: ['creator'] })
    },
  })
}

export function useCreatorDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('creator_delete_comment', {
        comment_id_input: commentId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator-manage', 'comments'] })
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}
