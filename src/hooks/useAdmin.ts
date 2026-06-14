import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { AdminPollRow, CreatePollInput, PollComment, PollStatus } from '../lib/types'
import { getAdminSecret } from '../lib/voter'

function requireAdminSecret(): string {
  const secret = getAdminSecret()
  if (!secret) throw new Error('Admin session expired')
  return secret
}

export function useAdminPolls() {
  return useQuery({
    queryKey: ['admin', 'polls'],
    queryFn: async (): Promise<AdminPollRow[]> => {
      if (!supabase) return []

      const { data, error } = await supabase.rpc('admin_list_polls', {
        admin_secret_input: requireAdminSecret(),
      })

      if (error) throw error
      return (data ?? []) as AdminPollRow[]
    },
    enabled: Boolean(getAdminSecret()),
  })
}

export function useAdminComments(pollId: string | null) {
  return useQuery({
    queryKey: ['admin', 'comments', pollId],
    queryFn: async (): Promise<PollComment[]> => {
      if (!supabase || !pollId) return []

      const { data, error } = await supabase.rpc('admin_list_comments', {
        admin_secret_input: requireAdminSecret(),
        poll_id_input: pollId,
      })

      if (error) throw error
      return (data ?? []) as PollComment[]
    },
    enabled: Boolean(pollId && getAdminSecret()),
  })
}

export function useCreatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePollInput) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase.rpc('admin_create_poll', {
        admin_secret_input: requireAdminSecret(),
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
      void queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] })
      void queryClient.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

export function useSetPollStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      status,
    }: {
      pollId: string
      status: PollStatus
    }) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('admin_set_poll_status', {
        admin_secret_input: requireAdminSecret(),
        poll_id_input: pollId,
        status_input: status,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] })
      void queryClient.invalidateQueries({ queryKey: ['polls'] })
      void queryClient.invalidateQueries({ queryKey: ['poll'] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('admin_delete_comment', {
        admin_secret_input: requireAdminSecret(),
        comment_id_input: commentId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

export function useAdminDeletePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('admin_delete_poll', {
        admin_secret_input: requireAdminSecret(),
        poll_id_input: pollId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] })
      void queryClient.invalidateQueries({ queryKey: ['polls'] })
      void queryClient.invalidateQueries({ queryKey: ['creator'] })
    },
  })
}
