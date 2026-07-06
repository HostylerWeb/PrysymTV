"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Lock, MessageCircle, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RelativeTime } from "@/components/relative-time"
import { userAvatarUrl } from "@/lib/user-avatar"
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const topComment = comments[0]

  useEffect(() => {
    setPage(1)
    setHasMore(commentsTotal > comments.length)
  }, [videoId, commentsTotal, comments.length])

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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || loadingMore || !hasMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      void loadMore()
    }
  }, [loadingMore, hasMore, loadMore])

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

  const renderCommentInput = () =>
    isAuthenticated ? (
      <div className="mb-4 space-y-2 shrink-0">
        {replyingTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>
              Replying to <span className="font-semibold">{replyingTo.user}</span>
            </span>
            <button type="button" onClick={() => onReplyingToChange(null)}>
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
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
            placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
            disabled={commentPosting}
            className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={commentPosting || !commentText.trim()}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        {commentError && <p className="text-xs text-destructive px-2">{commentError}</p>}
      </div>
    ) : (
      <button
        type="button"
        onClick={onRequireAuth}
        className="w-full py-3 rounded-xl bg-secondary/50 border border-dashed flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 shrink-0"
      >
        <Lock className="w-4 h-4" /> Sign in to comment
      </button>
    )

  const renderCommentList = () => (
    <div className="space-y-3">
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground px-2">No comments yet. Be the first.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} id={`comment-${c.id}`} className="space-y-2 scroll-mt-4">
          <div className="flex gap-2">
            <img
              src={userAvatarUrl(c.user.avatarUrl, c.user.username)}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {c.user.displayName ?? c.user.username}
                <RelativeTime
                  date={c.createdAt}
                  className="ml-2 text-xs font-normal text-muted-foreground"
                />
              </p>
              <p className="text-sm text-muted-foreground">{c.body}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  className={cn(c.liked && "text-primary")}
                  onClick={() => onCommentLike(c.id)}
                >
                  Like{c.likesCount > 0 ? ` · ${c.likesCount}` : ""}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated
                      ? onReplyingToChange({
                          id: c.id,
                          user: c.user.displayName ?? c.user.username,
                        })
                      : onRequireAuth()
                  }
                >
                  Reply
                </button>
                {currentUserId === c.user.id && (
                  <button
                    type="button"
                    className="text-destructive"
                    onClick={() => onRemoveComment(c.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
          {(c.replies ?? []).map((reply) => (
            <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-2 ml-10 scroll-mt-4">
              <img
                src={userAvatarUrl(reply.user.avatarUrl, reply.user.username)}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {reply.user.displayName ?? reply.user.username}
                  <RelativeTime
                    date={reply.createdAt}
                    className="ml-2 text-xs font-normal text-muted-foreground"
                  />
                </p>
                <p className="text-sm text-muted-foreground">{reply.body}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className={cn(reply.liked && "text-primary")}
                    onClick={() => onCommentLike(reply.id)}
                  >
                    Like{reply.likesCount > 0 ? ` · ${reply.likesCount}` : ""}
                  </button>
                  {currentUserId === reply.user.id && (
                    <button
                      type="button"
                      className="text-destructive"
                      onClick={() => onRemoveComment(reply.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      {loadingMore && (
        <p className="text-xs text-muted-foreground text-center py-2">Loading more comments…</p>
      )}
    </div>
  )

  return (
    <>
      {!open && (part === "preview" || part === "both") && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="w-full text-left py-3 border-t border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Comments{commentsTotal > 0 ? ` (${commentsTotal})` : ""}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>
          {topComment ? (
            <div className="flex gap-2 pointer-events-none">
              <img
                src={userAvatarUrl(topComment.user.avatarUrl, topComment.user.username)}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {topComment.user.displayName ?? topComment.user.username}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">{topComment.body}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add a comment…</p>
          )}
        </button>
      )}

      {open && (part === "panel" || part === "both") && (
        <>
          {/* Mobile: bottom sheet (YouTube-style) */}
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <aside
            className={cn(
              "z-50 flex flex-col bg-background border-border md:hidden",
              "fixed bottom-0 left-0 right-0 max-h-[75vh] rounded-t-2xl border-t shadow-2xl",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold">
                Comments{commentsTotal > 0 ? ` · ${commentsTotal}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"
                aria-label="Close comments"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
            >
              {renderCommentInput()}
              {renderCommentList()}
            </div>
          </aside>

          {/* Desktop: expand inline below video (YouTube-style) */}
          <div className="hidden md:block border-t border-border py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Comments{commentsTotal > 0 ? ` · ${commentsTotal}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide
              </button>
            </div>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[min(60vh,520px)] overflow-y-auto"
            >
              {renderCommentInput()}
              {renderCommentList()}
            </div>
          </div>
        </>
      )}
    </>
  )
}
