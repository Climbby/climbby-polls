import { useQuery } from '@tanstack/react-query'
import { getCommentsLastSeenAt } from '../lib/comment-seen'
import { supabase } from '../lib/supabase'

export function useUnseenCommentCount(pollId: string | undefined, enabled: boolean) {
  const lastSeenAt = pollId ? getCommentsLastSeenAt(pollId) : null

  return useQuery({
    queryKey: ['unseen-comments', pollId, lastSeenAt],
    queryFn: async (): Promise<number> => {
      if (!supabase || !pollId) return 0

      let query = supabase
        .from('poll_comments')
        .select('id', { count: 'exact', head: true })
        .eq('poll_id', pollId)

      if (lastSeenAt) {
        query = query.gt('created_at', lastSeenAt)
      }

      const { count, error } = await query
      if (error) throw error
      return count ?? 0
    },
    enabled: Boolean(supabase && pollId && enabled),
    refetchInterval: enabled ? 30_000 : false,
  })
}
