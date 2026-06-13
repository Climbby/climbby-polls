import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { PollComment, PollOption, PollResultRow, PollWithDetails } from '../lib/types'
import { getVoterToken } from '../lib/voter'

async function fetchPollBySlug(slug: string): Promise<PollWithDetails | null> {
  if (!supabase) return null

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*, poll_categories(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (pollError) throw pollError
  if (!poll) return null

  const { data: options, error: optionsError } = await supabase
    .from('poll_options')
    .select('*')
    .eq('poll_id', poll.id)
    .order('sort_order')

  if (optionsError) throw optionsError

  const { data: results, error: resultsError } = await supabase
    .from('poll_results')
    .select('*')
    .eq('poll_id', poll.id)
    .order('sort_order')

  if (resultsError) throw resultsError

  const resultRows = (results ?? []) as PollResultRow[]
  const totalVotes = resultRows.reduce((sum, row) => sum + row.vote_count, 0)

  return {
    ...(poll as PollWithDetails),
    options: (options ?? []) as PollOption[],
    results: resultRows,
    total_votes: totalVotes,
  }
}

export function usePoll(slug: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['poll', slug],
    queryFn: () => fetchPollBySlug(slug),
    enabled: Boolean(slug),
  })

  useEffect(() => {
    const client = supabase
    if (!client || !query.data?.id) return

    const pollId = query.data.id
    const channel = client
      .channel(`poll-${pollId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes', filter: `poll_id=eq.${pollId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['poll', slug] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'poll_comments', filter: `poll_id=eq.${pollId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['comments', pollId] })
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [query.data?.id, slug, queryClient])

  return query
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
