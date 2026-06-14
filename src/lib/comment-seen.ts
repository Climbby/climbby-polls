const SEEN_KEY_PREFIX = 'climbby-polls:comments-seen:'

function seenKey(pollId: string) {
  return `${SEEN_KEY_PREFIX}${pollId}`
}

export function getCommentsLastSeenAt(pollId: string): string | null {
  return localStorage.getItem(seenKey(pollId))
}

export function markCommentsSeen(pollId: string, seenAt = new Date().toISOString()) {
  localStorage.setItem(seenKey(pollId), seenAt)
}
