import { supabase } from './supabase'
import type { PollOption, PollResultRow } from './types'

export type ResultTimeframe = '7d' | '30d' | 'alltime'

export const TIMEFRAME_LABELS: Record<ResultTimeframe, string> = {
  '7d': '7d',
  '30d': '30d',
  alltime: 'All Time',
}

function sinceForTimeframe(timeframe: ResultTimeframe): Date | null {
  if (timeframe === 'alltime') return null
  const since = new Date()
  since.setDate(since.getDate() - (timeframe === '7d' ? 7 : 30))
  return since
}

export function resultsFromRows(
  options: PollOption[],
  rows: PollResultRow[],
): { results: PollResultRow[]; totalVotes: number } {
  const countByOption = new Map(rows.map((row) => [row.option_id, row.vote_count]))
  const results = options.map((option) => ({
    poll_id: option.poll_id,
    option_id: option.id,
    label: option.label,
    sort_order: option.sort_order,
    color: option.color,
    vote_count: countByOption.get(option.id) ?? 0,
  }))
  const totalVotes = results.reduce((sum, row) => sum + row.vote_count, 0)
  return { results, totalVotes }
}

export function applyOptimisticVoteDelta(
  results: PollResultRow[],
  totalVotes: number,
  fromOptionId: string | null,
  toOptionId: string,
): { results: PollResultRow[]; totalVotes: number } {
  if (fromOptionId === toOptionId) {
    return { results, totalVotes }
  }

  const next = results.map((row) => ({ ...row }))

  if (fromOptionId) {
    const fromRow = next.find((row) => row.option_id === fromOptionId)
    if (fromRow) fromRow.vote_count = Math.max(0, fromRow.vote_count - 1)
  }

  const toRow = next.find((row) => row.option_id === toOptionId)
  if (toRow) {
    toRow.vote_count += 1
  }

  return {
    results: next,
    totalVotes: fromOptionId ? totalVotes : totalVotes + 1,
  }
}

export async function fetchPollResultsForTimeframe(
  pollId: string,
  options: PollOption[],
  alltimeResults: PollResultRow[],
  timeframe: ResultTimeframe,
): Promise<{ results: PollResultRow[]; totalVotes: number }> {
  if (timeframe === 'alltime') {
    return resultsFromRows(options, alltimeResults)
  }

  if (!supabase) {
    return resultsFromRows(options, alltimeResults)
  }

  const since = sinceForTimeframe(timeframe)
  let query = supabase.from('poll_votes').select('option_id').eq('poll_id', pollId)
  if (since) query = query.gte('created_at', since.toISOString())

  const { data, error } = await query
  if (error) throw error

  const counts = new Map<string, number>()
  for (const option of options) counts.set(option.id, 0)
  for (const vote of data ?? []) {
    counts.set(vote.option_id, (counts.get(vote.option_id) ?? 0) + 1)
  }

  const results = options.map((option) => ({
    poll_id: pollId,
    option_id: option.id,
    label: option.label,
    sort_order: option.sort_order,
    color: option.color,
    vote_count: counts.get(option.id) ?? 0,
  }))

  return {
    results,
    totalVotes: results.reduce((sum, row) => sum + row.vote_count, 0),
  }
}
