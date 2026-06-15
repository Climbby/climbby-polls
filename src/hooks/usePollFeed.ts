import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PollOption, PollResultRow, PollWithDetails } from '../lib/types'

function sortPollsByPinThenDate<T extends { pinned_at: string | null; created_at: string }>(
  polls: T[],
): T[] {
  return [...polls].sort((a, b) => {
    const aPinned = a.pinned_at ? 1 : 0
    const bPinned = b.pinned_at ? 1 : 0
    if (bPinned !== aPinned) return bPinned - aPinned
    if (a.pinned_at && b.pinned_at) {
      return new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime()
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

async function fetchPollsWithDetails(
  creatorId: string,
  status: 'active' | 'closed',
): Promise<PollWithDetails[]> {
  if (!supabase) return []

  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('*, poll_categories(*)')
    .eq('creator_id', creatorId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (pollsError) throw pollsError
  if (!polls?.length) return []

  const orderedPolls = sortPollsByPinThenDate(polls)
  const pollIds = orderedPolls.map((poll) => poll.id)

  const [{ data: options, error: optionsError }, { data: results, error: resultsError }] =
    await Promise.all([
      supabase.from('poll_options').select('*').in('poll_id', pollIds).order('sort_order'),
      supabase.from('poll_results').select('*').in('poll_id', pollIds).order('sort_order'),
    ])

  if (optionsError) throw optionsError
  if (resultsError) throw resultsError

  const optionsByPoll = groupBy(pollIds, options ?? [], 'poll_id')
  const resultsByPoll = groupBy(pollIds, results ?? [], 'poll_id')

  return orderedPolls.map((poll) => {
    const pollResults = (resultsByPoll.get(poll.id) ?? []) as PollResultRow[]
    return {
      ...(poll as PollWithDetails),
      options: (optionsByPoll.get(poll.id) ?? []) as PollOption[],
      results: pollResults,
      total_votes: pollResults.reduce((sum, row) => sum + row.vote_count, 0),
    }
  })
}

function groupBy<T extends { poll_id: string }>(
  pollIds: string[],
  rows: T[],
  key: keyof T,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const id of pollIds) map.set(id, [])
  for (const row of rows) {
    const id = row[key] as string
    map.get(id)?.push(row)
  }
  return map
}

export function usePollFeed(creatorId: string | undefined) {
  const active = useQuery({
    queryKey: ['poll-feed', creatorId, 'active'],
    queryFn: () => fetchPollsWithDetails(creatorId!, 'active'),
    enabled: Boolean(creatorId),
  })

  const closed = useQuery({
    queryKey: ['poll-feed', creatorId, 'closed'],
    queryFn: () => fetchPollsWithDetails(creatorId!, 'closed'),
    enabled: Boolean(creatorId),
  })

  return {
    activePolls: active.data ?? [],
    closedPolls: closed.data ?? [],
    isLoading: active.isLoading || closed.isLoading,
    error: active.error ?? closed.error,
  }
}

export async function fetchPollBySlug(
  creatorId: string,
  pollSlug: string,
): Promise<PollWithDetails | null> {
  const active = await fetchPollsWithDetails(creatorId, 'active')
  const closed = await fetchPollsWithDetails(creatorId, 'closed')
  return [...active, ...closed].find((poll) => poll.slug === pollSlug) ?? null
}
