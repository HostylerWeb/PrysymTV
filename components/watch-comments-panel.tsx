"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Lock, Send, ThumbsUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RelativeTime } from "@/components/relative-time"
import { userAvatarUrl } from "@/lib/user-avatar"
import { formatViewCount } from "@/lib/format-media"
import {
  fetchVideoComments,
  normalizeVideoComment,
  type VideoComment,
} from "@/lib/api/comments"

type WatchCommentsPanelProps = {
  videoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: "preview" | "panel" | "both"
  comments: VideoComment[]
  commentsTotal: number
  onCommentsChange: (comments: VideoComment[]) => void
  onTotalChange: (total: number) => void
  isAuthenticated: boolean
  currentUserId?: string
  currentUserAvatar?: string | null
  currentUserLabel?: string
  commentText: string
  onCommentTextChange: (text: string) => void
  commentError: string | null
  onCommentErrorChange: (error: string | null) => void
  commentPosting: boolean
  onSubmitComment: () => void
  replyingTo: { id: string; user: string } | null
  onReplyingToChange: (reply: { id: string; user: string } | null) => void
  onRequireAuth: () => void
  onCommentLike: (commentId: string) => void
  onRemoveComment: (commentId: string) => void
  highlightCommentId?: string | null
}

const COMMENTS_PAGE_SIZE = 15
const MOBILE_MINI_PLAYER_VH = 32

function commentAuthorLabel(c: VideoComment) {
  return c.user.displayName ?? c.user.username
}

export function WatchCommentsPanel({
  videoId,
  open,
  onOpenChange,
  comments,
  commentsTotal,
  onCommentsChange,
  onTotalChange,
  isAuthenticated,
  currentUserId,
  currentUserAvatar,
  currentUserLabel = "user",
  commentText,
  onCommentTextChange,
  commentError,
  onCommentErrorChange,
  commentPosting,
  onSubmitComment,
  replyingTo,
  onReplyingToChange,
  onRequireAuth,
  onCommentLike,
  onRemoveComment,
  highlightCommentId,
  part = "both",
}: WatchCommentsPanelProps) {
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const topComment = comments[0]
  const countLabel = commentsTotal > 0 ? formatViewCount(commentsTotal) : null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setPage(1)
    setHasMore(commentsTotal > comments.length)
  }, [videoId, commentsTotal, comments.length])

  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia("(max-width: 767px)")
    if (!mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const res = await fetchVideoComments(videoId, nextPage)
      const items = res.items.map((item) =>
        normalizeVideoComment(item as unknown as Record<string, unknown>),
      )
      onCommentsChange([...comments, ...items])
      onTotalChange(res.meta.total)
      setPage(nextPage)
      setHasMore(nextPage * COMMENTS_PAGE_SIZE < res.meta.total)
    } catch {
      /* keep existing */
    } finally {
      setLoadingMore(false)
    }
  }, [
    loadingMore,
    hasMore,
    page,
    videoId,
    comments,
    onCommentsChange,
    onTotalChange,
  ])

  const handleScroll = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || loadingMore || !hasMore) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 160) {
        void loadMore()
      }
    },
    [loadingMore, hasMore, loadMore],
  )

  useEffect(() => {
    if (!highlightCommentId || !open) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      el?.classList.add("ring-2", "ring-primary", "rounded-lg")
      window.setTimeout(() => {
        el?.classList.remove("ring-2", "ring-primary", "rounded-lg")
      }, 2500)
    }, 200)
    return () => window.clearTimeout(t)
  }, [highlightCommentId, open, comments])

  const renderCommentRow = (c: VideoComment, isReply = false) => (
    <div
      key={c.id}
      id={`comment-${c.id}`}
      className={cn("flex gap-3 scroll-mt-4", isReply && "ml-11")}
    >
      <img
        src={userAvatarUrl(c.user.avatarUrl, c.user.username)}
        alt=""
        className={cn(
          "rounded-full object-cover shrink-0",
          isReply ? "w-7 h-7" : "w-9 h-9",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">
            @{c.user.username}
          </span>
          <RelativeTime date={c.createdAt} className="text-xs text-muted-foreground" />
        </div>
        <p className="text-sm text-foreground mt-0.5 leading-snug break-words">{c.body}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 hover:text-foreground",
              c.liked && "text-primary",
            )}
            onClick={() => onCommentLike(c.id)}
          >
            <ThumbsUp className={cn("w-4 h-4", c.liked && "fill-primary")} />
            {c.likesCount > 0 ? formatViewCount(c.likesCount) : null}
          </button>
          {!isReply && (
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() =>
                isAuthenticated
                  ? onReplyingToChange({
                      id: c.id,
                      user: commentAuthorLabel(c),
                    })
                  : onRequireAuth()
              }
            >
              Reply
            </button>
          )}
          {currentUserId === c.user.id && (
            <button
              type="button"
              className="text-destructive hover:text-destructive/80"
              onClick={() => onRemoveComment(c.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const renderCommentList = () => (
    <div className="space-y-5 pb-2">
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No comments yet. Be the first.
        </p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="space-y-4">
          {renderCommentRow(c)}
          {(c.replies ?? []).map((reply) => renderCommentRow(reply, true))}
        </div>
      ))}
      {loadingMore && (
        <p className="text-xs text-muted-foreground text-center py-3">Loading more comments…</p>
      )}
    </div>
  )

  const renderAddCommentRow = (compact = false) => {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          onClick={onRequireAuth}
          className={cn(
            "w-full flex items-center gap-3 text-left text-sm text-muted-foreground",
            compact ? "py-3" : "py-4",
          )}
        >
          <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
          <span>Add a comment…</span>
        </button>
      )
    }

    return (
      <div className={cn("space-y-2", compact ? "py-3" : "py-4")}>
        {replyingTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Replying to <span className="font-semibold text-foreground">{replyingTo.user}</span>
            </span>
            <button type="button" onClick={() => onReplyingToChange(null)} className="hover:text-foreground">
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <img
            src={userAvatarUrl(currentUserAvatar, currentUserLabel)}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <input
            value={commentText}
            onChange={(e) => {
              onCommentTextChange(e.target.value)
              if (commentError) onCommentErrorChange(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSubmitComment()
              }
            }}
            placeholder={replyingTo ? "Add a reply…" : "Add a comment…"}
            disabled={commentPosting}
            className="flex-1 bg-transparent border-b border-border pb-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={commentPosting || !commentText.trim()}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 shrink-0"
            aria-label="Post comment"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        {commentError && <p className="text-xs text-destructive pl-12">{commentError}</p>}
      </div>
    )
  }

  const mobileSheet =
    open && mounted
      ? createPortal(
          <aside
            className="fixed inset-x-0 bottom-0 z-[55] flex flex-col bg-background md:hidden animate-in slide-in-from-bottom duration-300"
            style={{ top: `${MOBILE_MINI_PLAYER_VH}vh` }}
            aria-label="Comments"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">Comments</h2>
              <div className="flex items-center gap-3">
                {countLabel && (
                  <span className="text-sm text-muted-foreground">{countLabel}</span>
                )}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center"
                  aria-label="Close comments"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 border-b border-border shrink-0">{renderAddCommentRow(true)}</div>

            <div
              ref={mobileScrollRef}
              onScroll={() => handleScroll(mobileScrollRef.current)}
              className="flex-1 overflow-y-auto px-4 pt-4 min-h-0 overscroll-contain"
            >
              {renderCommentList()}
            </div>
          </aside>,
          document.body,
        )
      : null

  return (
    <>
      {!open && (part === "preview" || part === "both") && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="w-full text-left py-4 border-t border-border active:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Comments</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              {countLabel && <span className="text-sm">{countLabel}</span>}
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {topComment ? (
            <div className="flex gap-3 pointer-events-none">
              <img
                src={userAvatarUrl(topComment.user.avatarUrl, topComment.user.username)}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-semibold text-foreground">
                    @{topComment.user.username}
                  </span>
                  <span className="text-muted-foreground ml-2">{topComment.body}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add a comment…</p>
          )}
        </button>
      )}

      {mobileSheet}

      {open && (part === "panel" || part === "both") && (
        <div className="hidden md:block border-t border-border py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Comments{countLabel ? ` · ${countLabel}` : ""}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          {renderAddCommentRow()}
          <div
            ref={desktopScrollRef}
            onScroll={() => handleScroll(desktopScrollRef.current)}
            className="max-h-[min(60vh,520px)] overflow-y-auto pr-1"
          >
            {renderCommentList()}
          </div>
        </div>
      )}
    </>
  )
}

export const WATCH_COMMENTS_MOBILE_PLAYER_VH = MOBILE_MINI_PLAYER_VH
