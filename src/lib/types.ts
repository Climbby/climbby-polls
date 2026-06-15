export type PollStatus = 'draft' | 'active' | 'closed'
export type VoteSource = 'web' | 'chat'

export interface PollCategory {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Poll {
  id: string
  slug: string
  title: string
  description: string | null
  category_id: string | null
  creator_id: string
  status: PollStatus
  allow_comments: boolean
  closes_at: string | null
  created_at: string
  closed_at: string | null
  pinned_at: string | null
  poll_categories?: PollCategory | null
}

export interface Creator {
  id: string
  slug: string
  display_name: string
  created_at: string
}

export interface CreatorDashboard extends Creator {
  active_polls: number
  closed_polls: number
  total_votes: number
}

export interface PollOption {
  id: string
  poll_id: string
  label: string
  sort_order: number
  color: string | null
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  voter_token: string
  source: VoteSource
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface PollComment {
  id: string
  poll_id: string
  author_name: string
  body: string
  option_id: string | null
  is_creator: boolean
  voter_token: string | null
  created_at: string
}

export interface PollResultRow {
  poll_id: string
  option_id: string
  label: string
  sort_order: number
  color: string | null
  vote_count: number
}

export interface PollWithDetails extends Poll {
  options: PollOption[]
  results: PollResultRow[]
  total_votes: number
}

export interface AdminPollRow {
  id: string
  slug: string
  title: string
  description: string | null
  category_id: string | null
  category_name: string | null
  status: PollStatus
  allow_comments: boolean
  vote_count: number
  comment_count: number
  created_at: string
  closed_at: string | null
  pinned_at: string | null
}

export interface CreatePollOptionInput {
  label: string
  color: string
}

export interface CreatePollInput {
  slug: string
  title: string
  description: string
  categoryId: string | null
  allowComments: boolean
  status: PollStatus
  options: CreatePollOptionInput[]
}
