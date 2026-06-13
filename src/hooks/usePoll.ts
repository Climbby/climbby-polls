import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PollComment } from '../lib/types'
import { getVoterToken } from '../lib/voter'
import { fetchPollBySlug } from './usePollFeed'

export function usePoll(slug: string) {
  return useQuery({
    queryKey: ['poll', slug],
    queryFn: () => fetchPollBySlug(slug),
    enabled: Boolean(slug),
  })
}

export function usePollComments(pollId: string | undefined) {
  return useQuery({
    queryKey: ['comments', pollId],
    queryFn: async (): Promise<PollComment[]> => {
      if (!supabase || !pollId) return []

      const { data, error } = await supabase
        .from('poll_comments')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(pollId),
  })
}

function invalidateFeed(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
}

export function useCastVote(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('cast_poll_vote', {
        poll_slug_input: slug,
        option_id_input: optionId,
        voter_token_input: getVoterToken(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFeed(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['poll', slug] })
    },
  })
}

export function useAddComment(pollId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ authorName, body }: { authorName: string; body: string }) => {
      if (!supabase || !pollId) throw new Error('Supabase is not configured')

      const { error } = await supabase.from('poll_comments').insert({
        poll_id: pollId,
        author_name: authorName.trim(),
        body: body.trim(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', pollId] })
    },
  })
}
