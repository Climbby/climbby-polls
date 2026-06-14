import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { applyOptimisticVoteDelta } from '../lib/poll-results'
import { supabase } from '../lib/supabase'
import type { PollComment, PollResultRow, PollWithDetails } from '../lib/types'
import { getVoterToken } from '../lib/voter'
import { fetchPollBySlug } from './usePollFeed'

type PollResultsCache = { results: PollResultRow[]; totalVotes: number }

interface CastVoteContext {
  mutationId: number
  previousUserVote: string | null | undefined
  previousFeed: Array<[QueryKey, PollWithDetails[] | undefined]>
  previousPollResults: Array<[QueryKey, PollResultsCache | undefined]>
}

function applyOptimisticVoteToPoll(
  poll: PollWithDetails,
  fromOptionId: string | null,
  toOptionId: string,
): PollWithDetails {
  const { results, totalVotes } = applyOptimisticVoteDelta(
    poll.results,
    poll.total_votes,
    fromOptionId,
    toOptionId,
  )
  return { ...poll, results, total_votes: totalVotes }
}

function applyOptimisticVoteToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  pollId: string,
  fromOptionId: string | null,
  toOptionId: string,
) {
  queryClient.setQueryData<string | null>(['user-vote', pollId], toOptionId)

  queryClient.setQueriesData<PollWithDetails[]>({ queryKey: ['poll-feed'] }, (old) =>
    old?.map((poll) =>
      poll.id === pollId ? applyOptimisticVoteToPoll(poll, fromOptionId, toOptionId) : poll,
    ),
  )

  queryClient.setQueriesData<PollResultsCache>({ queryKey: ['poll-results', pollId] }, (old) =>
    old
      ? applyOptimisticVoteDelta(old.results, old.totalVotes, fromOptionId, toOptionId)
      : old,
  )
}

function restoreOptimisticVoteCache(
  queryClient: ReturnType<typeof useQueryClient>,
  pollId: string,
  context: CastVoteContext,
) {
  queryClient.setQueryData(['user-vote', pollId], context.previousUserVote)

  for (const [queryKey, data] of context.previousFeed) {
    queryClient.setQueryData(queryKey, data)
  }

  for (const [queryKey, data] of context.previousPollResults) {
    queryClient.setQueryData(queryKey, data)
  }
}

export function usePoll(creatorId: string | undefined, pollSlug: string) {
  return useQuery({
    queryKey: ['poll', creatorId, pollSlug],
    queryFn: () => fetchPollBySlug(creatorId!, pollSlug),
    enabled: Boolean(creatorId && pollSlug),
  })
}

export function usePollComments(pollId: string | undefined) {
  return useQuery({
    queryKey: ['comments', pollId],
    queryFn: async (): Promise<PollComment[]> => {
      if (!supabase || !pollId) return []

      const { data, error } = await supabase
        .from('poll_comments')
        .select('id, poll_id, author_name, body, option_id, is_creator, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(pollId),
  })
}

export function useUserVote(pollId: string | undefined) {
  return useQuery({
    queryKey: ['user-vote', pollId],
    queryFn: async (): Promise<string | null> => {
      if (!supabase || !pollId) return null

      const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('voter_token', getVoterToken())
        .maybeSingle()

      if (error) throw error
      return data?.option_id ?? null
    },
    enabled: Boolean(pollId),
  })
}

export function useCastVote(creatorSlug: string, pollSlug: string, pollId: string) {
  const queryClient = useQueryClient()
  const mutationSeqRef = useRef(0)

  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.rpc('cast_poll_vote', {
        creator_slug_input: creatorSlug,
        poll_slug_input: pollSlug,
        option_id_input: optionId,
        voter_token_input: getVoterToken(),
      })

      if (error) throw error
    },
    onMutate: async (optionId) => {
      const mutationId = ++mutationSeqRef.current
      const previousUserVote = queryClient.getQueryData<string | null>(['user-vote', pollId])

      if (previousUserVote === optionId) {
        return { mutationId, previousUserVote, previousFeed: [], previousPollResults: [] }
      }

      await queryClient.cancelQueries({ queryKey: ['user-vote', pollId] })
      await queryClient.cancelQueries({ queryKey: ['poll-feed'] })
      await queryClient.cancelQueries({ queryKey: ['poll-results', pollId] })

      const previousFeed = queryClient.getQueriesData<PollWithDetails[]>({
        queryKey: ['poll-feed'],
      })
      const previousPollResults = queryClient.getQueriesData<PollResultsCache>({
        queryKey: ['poll-results', pollId],
      })

      applyOptimisticVoteToCache(
        queryClient,
        pollId,
        previousUserVote ?? null,
        optionId,
      )

      return {
        mutationId,
        previousUserVote,
        previousFeed,
        previousPollResults,
      } satisfies CastVoteContext
    },
    onError: (_error, optionId, context) => {
      if (!context || context.mutationId !== mutationSeqRef.current) return

      const currentVote = queryClient.getQueryData<string | null>(['user-vote', pollId])
      if (currentVote !== optionId) return

      restoreOptimisticVoteCache(queryClient, pollId, context)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['poll-feed'] })
      void queryClient.invalidateQueries({ queryKey: ['poll'] })
      void queryClient.invalidateQueries({ queryKey: ['poll-results', pollId] })
    },
  })
}

export function useAddComment(pollId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      authorName,
      body,
      optionId,
      isCreator,
    }: {
      authorName: string
      body: string
      optionId?: string | null
      isCreator?: boolean
    }) => {
      if (!supabase || !pollId) throw new Error('Supabase is not configured')

      const { error } = await supabase.from('poll_comments').insert({
        poll_id: pollId,
        author_name: authorName.trim(),
        body: body.trim(),
        option_id: optionId ?? null,
        is_creator: Boolean(isCreator),
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', pollId] })
    },
  })
}
