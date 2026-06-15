import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAddComment, useCastVote, useDeleteComment, usePollComments, useUserVote } from '../hooks/usePoll'
import { useMyCreator } from '../hooks/useCreator'
import { usePollResults } from '../hooks/usePollResults'
import { useUnseenCommentCount } from '../hooks/useUnseenComments'
import { markCommentsSeen } from '../lib/comment-seen'
import { formatPollStarted } from '../lib/time'
import type { ResultTimeframe } from '../lib/poll-results'
import type { PollWithDetails } from '../lib/types'
import { Comments } from './Comments'
import { CreatorCommentPanel } from './CreatorCommentPanel'
import { PollOptions } from './PollOptions'
import { TimeframePills } from './TimeframePills'
import { CommentIcon, IconButton, PinIcon } from './ui/IconButton'

/** Matches --polls-comments-enter-ms in index.css */
const COMMENTS_ANIM_MS = 480
const NOTES_SLOT_PX = 216 // 13.5rem at 16px root
const NOTES_GAP_PX = 12 // 0.75rem at 16px root
const NOTES_SLOT_EASE_IN = 'cubic-bezier(0.16, 1, 0.3, 1)'
const NOTES_SLOT_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

type NotesSlotPhase = 'idle' | 'enter' | 'open' | 'exit'
type NotesPanelPhase = 'idle' | 'enter' | 'open' | 'exit'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isDesktopNotesLayout() {
  return window.matchMedia('(min-width: 768px)').matches
}

function clearNotesLayoutInlineStyles(el: HTMLDivElement, notesEl?: HTMLElement | null) {
  el.style.gap = ''
  el.style.transition = ''
  if (!notesEl) return
  notesEl.style.flex = ''
  notesEl.style.width = ''
  notesEl.style.maxWidth = ''
  notesEl.style.opacity = ''
  notesEl.style.transition = ''
}

function runCreatorNotesSlotCloseAnimation(el: HTMLDivElement, notesEl: HTMLElement) {
  const durationMs = prefersReducedMotion() ? 0 : COMMENTS_ANIM_MS

  const startWidth = notesEl.getBoundingClientRect().width || NOTES_SLOT_PX
  const startGap = Number.parseFloat(getComputedStyle(el).gap) || NOTES_GAP_PX

  notesEl.style.flex = 'none'
  notesEl.style.width = `${startWidth}px`
  notesEl.style.maxWidth = `${startWidth}px`
  notesEl.style.opacity = '1'
  el.style.gap = `${startGap}px`

  if (durationMs === 0) {
    el.style.transition = 'none'
    notesEl.style.transition = 'none'
    el.style.gap = '0px'
    notesEl.style.width = '0px'
    notesEl.style.maxWidth = '0px'
    notesEl.style.opacity = '0'
    return
  }

  el.style.transition = `gap ${durationMs}ms ${NOTES_SLOT_EASE_OUT}`
  notesEl.style.transition = `width ${durationMs}ms ${NOTES_SLOT_EASE_OUT}, max-width ${durationMs}ms ${NOTES_SLOT_EASE_OUT}, opacity ${durationMs}ms ${NOTES_SLOT_EASE_OUT}`

  void notesEl.offsetWidth

  el.style.gap = '0px'
  notesEl.style.width = '0px'
  notesEl.style.maxWidth = '0px'
  notesEl.style.opacity = '0'
}

function runCreatorNotesSlotOpenAnimation(el: HTMLDivElement, notesEl: HTMLElement) {
  const durationMs = prefersReducedMotion() ? 0 : COMMENTS_ANIM_MS

  notesEl.style.flex = 'none'
  notesEl.style.width = '0px'
  notesEl.style.maxWidth = '0px'
  notesEl.style.opacity = '0'
  el.style.gap = '0px'

  if (durationMs === 0) {
    el.style.transition = 'none'
    notesEl.style.transition = 'none'
    el.style.gap = `${NOTES_GAP_PX}px`
    notesEl.style.width = `${NOTES_SLOT_PX}px`
    notesEl.style.maxWidth = `${NOTES_SLOT_PX}px`
    return
  }

  el.style.transition = `gap ${durationMs}ms ${NOTES_SLOT_EASE_IN}`
  notesEl.style.transition = `width ${durationMs}ms ${NOTES_SLOT_EASE_IN}, max-width ${durationMs}ms ${NOTES_SLOT_EASE_IN}`

  void notesEl.offsetWidth

  el.style.gap = `${NOTES_GAP_PX}px`
  notesEl.style.width = `${NOTES_SLOT_PX}px`
  notesEl.style.maxWidth = `${NOTES_SLOT_PX}px`
}

interface PollSectionProps {
  poll: PollWithDetails
  creatorSlug: string
  showComments?: boolean
  commentsOpen?: boolean
  onToggleComments?: () => void
  showPinControl?: boolean
  onTogglePin?: () => void
  isPinPending?: boolean
}

export function PollSection({
  poll,
  creatorSlug,
  showComments = true,
  commentsOpen: commentsOpenProp,
  onToggleComments,
  showPinControl = false,
  onTogglePin,
  isPinPending = false,
}: PollSectionProps) {
  const queryClient = useQueryClient()
  const isActive = poll.status === 'active'
  const { data: myCreator } = useMyCreator()
  const isCreatorAuthor = Boolean(myCreator && myCreator.id === poll.creator_id)
  const castVote = useCastVote(creatorSlug, poll.slug, poll.id)
  const addComment = useAddComment(poll.id)
  const deleteComment = useDeleteComment(poll.id)
  const { data: savedVoteOptionId } = useUserVote(poll.id)
  const [internalCommentsOpen, setInternalCommentsOpen] = useState(false)
  const [timeframe, setTimeframe] = useState<ResultTimeframe>('alltime')
  const [commentsMounted, setCommentsMounted] = useState(false)
  const [commentsAnim, setCommentsAnim] = useState<
    'waiting' | 'enter' | 'open' | 'exit' | 'idle'
  >('idle')
  const [notesSlotPhase, setNotesSlotPhase] = useState<NotesSlotPhase>('idle')
  const [notesPanelPhase, setNotesPanelPhase] = useState<NotesPanelPhase>('idle')
  const layoutRef = useRef<HTMLDivElement>(null)
  const notesOpenStartedRef = useRef(false)

  const isCommentsControlled = onToggleComments !== undefined
  const commentsOpen = isCommentsControlled ? Boolean(commentsOpenProp) : internalCommentsOpen

  const trackUnseen = isCreatorAuthor && poll.allow_comments && !commentsOpen
  const { data: unseenCount = 0 } = useUnseenCommentCount(poll.id, trackUnseen)

  const votedOptionId = savedVoteOptionId ?? null

  const { data: filtered } = usePollResults(
    poll.id,
    poll.options,
    poll.results,
    timeframe,
  )

  const commentsEnabled = Boolean(
    showComments && poll.allow_comments && (commentsOpen || commentsMounted),
  )

  const { data: comments = [], isLoading: commentsLoading, isError: commentsError } = usePollComments(
    commentsEnabled ? poll.id : undefined,
  )

  const creatorComments = useMemo(
    () => comments.filter((comment) => comment.is_creator),
    [comments],
  )

  const communityComments = useMemo(
    () => comments.filter((comment) => !comment.is_creator),
    [comments],
  )

  const showNotesLayout = Boolean(
    showComments && poll.allow_comments && commentsMounted && creatorComments.length > 0,
  )

  useEffect(() => {
    if (!commentsOpen || !isCreatorAuthor || !poll.allow_comments) return

    markCommentsSeen(poll.id)
    void queryClient.invalidateQueries({ queryKey: ['unseen-comments', poll.id] })
  }, [commentsOpen, isCreatorAuthor, poll.allow_comments, poll.id, queryClient])

  useEffect(() => {
    if (!commentsOpen) return

    setCommentsMounted(true)
    setNotesPanelPhase('idle')
    notesOpenStartedRef.current = false

    const hasDesktopNotes = creatorComments.length > 0 && isDesktopNotesLayout()
    setNotesSlotPhase(hasDesktopNotes ? 'enter' : 'idle')

    const delayCommentsEnter =
      creatorComments.length > 0 && isDesktopNotesLayout() ? COMMENTS_ANIM_MS : 0

    setCommentsAnim(delayCommentsEnter > 0 ? 'waiting' : 'enter')

    let enterTimer: number | undefined
    let openTimer: number | undefined
    let idleTimer: number | undefined

    if (delayCommentsEnter > 0) {
      enterTimer = window.setTimeout(() => {
        setCommentsAnim('enter')
        openTimer = window.setTimeout(() => {
          setCommentsAnim('open')
          idleTimer = window.setTimeout(() => setCommentsAnim('idle'), COMMENTS_ANIM_MS)
        }, COMMENTS_ANIM_MS)
      }, delayCommentsEnter)
    } else {
      openTimer = window.setTimeout(() => {
        setCommentsAnim('open')
        idleTimer = window.setTimeout(() => setCommentsAnim('idle'), COMMENTS_ANIM_MS)
      }, COMMENTS_ANIM_MS)
    }

    return () => {
      if (enterTimer !== undefined) window.clearTimeout(enterTimer)
      if (openTimer !== undefined) window.clearTimeout(openTimer)
      if (idleTimer !== undefined) window.clearTimeout(idleTimer)
    }
  }, [commentsOpen, creatorComments.length])

  useEffect(() => {
    if (commentsOpen || !commentsMounted) return

    setCommentsAnim('exit')

    const hasCreatorNotes = creatorComments.length > 0
    const usesDesktopSlot = hasCreatorNotes && isDesktopNotesLayout()
    const totalDuration = hasCreatorNotes ? COMMENTS_ANIM_MS * 2 : COMMENTS_ANIM_MS

    let slotTimer: number | undefined

    if (hasCreatorNotes) {
      slotTimer = window.setTimeout(() => {
        if (usesDesktopSlot) {
          setNotesSlotPhase('exit')
          const el = layoutRef.current
          const notesEl = el?.querySelector('.poll-creator-notes') as HTMLElement | null
          if (el && notesEl) {
            runCreatorNotesSlotCloseAnimation(el, notesEl)
          }
        } else {
          setNotesPanelPhase('exit')
        }
      }, COMMENTS_ANIM_MS)
    }

    const exitTimer = window.setTimeout(() => {
      setCommentsMounted(false)
      setCommentsAnim('idle')
      setNotesSlotPhase('idle')
      setNotesPanelPhase('idle')
      notesOpenStartedRef.current = false
    }, totalDuration)

    return () => {
      window.clearTimeout(exitTimer)
      if (slotTimer !== undefined) window.clearTimeout(slotTimer)
    }
  }, [commentsOpen, commentsMounted, creatorComments.length])

  useLayoutEffect(() => {
    if (!commentsOpen || notesSlotPhase !== 'enter' || !showNotesLayout) return
    if (!isDesktopNotesLayout()) return

    const el = layoutRef.current
    const notesEl = el?.querySelector('.poll-creator-notes') as HTMLElement | null
    if (!el || !notesEl) return

    runCreatorNotesSlotOpenAnimation(el, notesEl)
  }, [commentsOpen, notesSlotPhase, showNotesLayout])

  useEffect(() => {
    if (!commentsOpen || !showNotesLayout) return
    if (notesOpenStartedRef.current) return
    notesOpenStartedRef.current = true

    const el = layoutRef.current

    let panelOpenTimer: number | undefined

    const panelEnterTimer = window.setTimeout(() => {
      const notesEl = el?.querySelector('.poll-creator-notes') as HTMLElement | null
      if (isDesktopNotesLayout() && el && notesEl) {
        clearNotesLayoutInlineStyles(el, notesEl)
      }
      setNotesSlotPhase('open')
      setNotesPanelPhase('enter')

      panelOpenTimer = window.setTimeout(() => {
        setNotesPanelPhase('open')
      }, COMMENTS_ANIM_MS)
    }, COMMENTS_ANIM_MS)

    return () => {
      window.clearTimeout(panelEnterTimer)
      if (panelOpenTimer !== undefined) window.clearTimeout(panelOpenTimer)
    }
  }, [commentsOpen, showNotesLayout])

  function handleToggleComments() {
    if (isCommentsControlled) {
      onToggleComments()
      return
    }
    setInternalCommentsOpen((open) => !open)
  }

  const commentsDrawerClass =
    commentsAnim === 'enter'
      ? 'poll-comments-drawer--enter'
      : commentsAnim === 'exit'
        ? 'poll-comments-drawer--exit'
        : commentsAnim === 'waiting'
          ? 'poll-comments-drawer--closed'
          : 'poll-comments-drawer--open'

  const notesPaired = showNotesLayout && notesSlotPhase === 'open'
  const notesSlotEntering = showNotesLayout && notesSlotPhase === 'enter'

  const creatorNotesLayoutPhase =
    notesSlotPhase === 'enter' || (notesPanelPhase === 'idle' && showNotesLayout && commentsOpen)
      ? 'slot-wait'
      : notesPanelPhase === 'enter'
        ? 'enter'
        : notesPanelPhase === 'exit'
          ? 'exit'
          : 'open'

  const results = filtered?.results ?? poll.results
  const totalVotes = filtered?.totalVotes ?? poll.total_votes
  const hasVoted = votedOptionId !== null
  const showResults = hasVoted || !isActive
  const allowVoteChange = isActive && hasVoted
  const submittingOptionId = castVote.isPending ? (castVote.variables ?? null) : null
  const isPinned = Boolean(poll.pinned_at)

  function handleVote(optionId: string) {
    if (optionId === votedOptionId) return
    castVote.mutate(optionId)
  }

  return (
    <div
      ref={layoutRef}
      className={[
        'scroll-mt-6',
        showNotesLayout ? 'poll-with-notes' : '',
        notesSlotEntering ? 'poll-with-notes--slot-entering' : '',
        notesPaired ? 'poll-with-notes--paired' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <article
        id={poll.slug}
        className="poll-block p-4 sm:p-5 md:p-6 lg:p-7"
      >
        <header className="mb-3 flex items-start justify-between gap-3 md:mb-4 md:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug text-ink sm:text-lg md:text-xl md:leading-tight">
              {poll.title}
            </h2>
            <p className="mt-1 text-xs text-ink-muted md:text-sm">
              Started {formatPollStarted(poll.created_at)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
            <TimeframePills value={timeframe} onChange={setTimeframe} />
            {showPinControl && onTogglePin && (
              <IconButton
                label={isPinned ? 'Unpin poll' : 'Pin poll to top'}
                onClick={onTogglePin}
                disabled={isPinPending}
                className={[
                  'transition-interactive shrink-0',
                  isPinned ? 'bg-accent-soft text-accent' : '',
                ].join(' ')}
              >
                <PinIcon filled={isPinned} />
              </IconButton>
            )}
            {showComments && poll.allow_comments && (
              <IconButton
                label="Comments"
                badge={isCreatorAuthor ? unseenCount : undefined}
                onClick={handleToggleComments}
                className={[
                  'transition-interactive shrink-0',
                  commentsOpen ? 'bg-surface-muted text-ink' : '',
                ].join(' ')}
              >
                <CommentIcon />
              </IconButton>
            )}
          </div>
        </header>

        <PollOptions
          options={poll.options}
          results={results}
          totalVotes={totalVotes}
          showResults={showResults}
          allowVoteChange={allowVoteChange}
          disabled={!isActive}
          submittingOptionId={submittingOptionId}
          highlightOptionId={votedOptionId ?? undefined}
          onVote={isActive ? handleVote : undefined}
        />

        {isActive && castVote.isError && (
          <p className="mt-2 text-sm text-danger">
            {(castVote.error as Error).message || 'Could not save vote.'}
          </p>
        )}

        {showComments && poll.allow_comments && commentsMounted && (
          <div className={['poll-comments-drawer', commentsDrawerClass].join(' ')}>
            <div className="poll-comments-drawer__inner">
              <div className="poll-comments-drawer__content">
                <Comments
                  comments={communityComments}
                  options={poll.options}
                  disabled={!isActive}
                  isLoading={commentsLoading}
                  isSubmitting={addComment.isPending}
                  isDeleting={deleteComment.isPending}
                  deletingCommentId={deleteComment.variables ?? null}
                  votedOptionId={votedOptionId}
                  isCreatorAuthor={isCreatorAuthor}
                  hideEmptyState={creatorComments.length > 0}
                  animPhase={commentsAnim === 'enter' || commentsAnim === 'open' ? 'enter' : 'exit'}
                  onSubmit={(authorName, body, optionId, isCreator) =>
                    addComment.mutate({ authorName, body, optionId, isCreator })
                  }
                  onDelete={(commentId) => deleteComment.mutate(commentId)}
                />
                {commentsError && (
                  <p className="mt-2 text-sm text-danger">Could not load comments.</p>
                )}
                {addComment.isError && (
                  <p className="mt-2 text-sm text-danger">Could not post comment.</p>
                )}
                {deleteComment.isError && (
                  <p className="mt-2 text-sm text-danger">Could not delete comment.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </article>

      {showNotesLayout && (
        <CreatorCommentPanel
          comments={creatorComments}
          layoutPhase={creatorNotesLayoutPhase}
          onDelete={(commentId) => deleteComment.mutate(commentId)}
          isDeleting={deleteComment.isPending}
          deletingCommentId={deleteComment.variables ?? null}
        />
      )}
    </div>
  )
}
