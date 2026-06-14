import { useQuery } from '@tanstack/react-query'
import { fetchPollResultsForTimeframe, type ResultTimeframe } from '../lib/poll-results'
import type { PollOption, PollResultRow } from '../lib/types'

export function usePollResults(
  pollId: string,
  options: PollOption[],
  alltimeResults: PollResultRow[],
  timeframe: ResultTimeframe,
) {
  return useQuery({
    queryKey: ['poll-results', pollId, timeframe],
    queryFn: () => fetchPollResultsForTimeframe(pollId, options, alltimeResults, timeframe),
    enabled: Boolean(pollId) && options.length > 0,
  })
}
