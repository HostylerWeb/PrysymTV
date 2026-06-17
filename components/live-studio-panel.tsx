"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Copy,
  Check,
  MessageSquare,
  Monitor,
  Radio,
  Send,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { BrowserLivePublisher } from "@/components/browser-live-publisher"
import { StreamChatLine, type StreamChatLine as ChatLine } from "@/components/stream-chat-line"
import type { StreamDetail, StreamStudioInfo } from "@/lib/api/streams"

type LiveStudioPanelProps = {
  stream: StreamDetail
  studio: StreamStudioInfo | null | undefined
  mode: "camera" | "obs"
  viewerCount: number
  chatMessages: ChatLine[]
  messageInput: string
  onMessageInputChange: (value: string) => void
  onSendMessage: () => void
  isEndingStream: boolean
  onEndStream: () => void | Promise<void>
  onCopyRtmp?: () => void
  copiedRtmp?: boolean
}

export function LiveStudioPanel({
  stream,
  studio,
  mode,
  viewerCount,
  chatMessages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  isEndingStream,
  onEndStream,
  onCopyRtmp,
  copiedRtmp,
}: LiveStudioPanelProps) {
  const [isPublishing, setIsPublishing] = useState(stream.status === "live")
  const useCamera = mode === "camera" && !!studio?.whipPublishUrl
  const onAir = useCamera ? isPublishing : stream.status === "live"

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full max-w-[1600px] mx-auto lg:px-4 lg:py-4 lg:gap-4">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-0 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/profile?settings=go-live">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary uppercase tracking-wide">
                Live Studio
              </p>
              <h1 className="text-sm md:text-base font-semibold truncate">{stream.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full bg-primary-foreground",
                  onAir && "animate-pulse",
                )}
              />
              {onAir ? "LIVE" : "PREVIEW"}
            </span>
            <span className="bg-secondary text-xs px-2.5 py-1 rounded flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {viewerCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative w-full aspect-video lg:aspect-auto lg:flex-1 lg:min-h-[300px] bg-zinc-950 rounded-none lg:rounded-xl overflow-hidden shrink-0 border border-border/50">
          {useCamera ? (
            <BrowserLivePublisher
              whipPublishUrl={studio!.whipPublishUrl}
              publishing={isPublishing}
            />
          ) : (
            <ObsStudioPlaceholder
              stream={stream}
              studio={studio}
              onCopyRtmp={onCopyRtmp}
              copiedRtmp={copiedRtmp}
            />
          )}
        </div>

        <div className="px-4 py-3 lg:px-0 lg:py-4 shrink-0">
          <div className="flex flex-wrap gap-2">
            {useCamera && !isPublishing && (
              <Button
                type="button"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => setIsPublishing(true)}
              >
                <Radio className="w-4 h-4" />
                Go Live
              </Button>
            )}
            {(onAir || isPublishing) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full gap-1.5"
                    disabled={isEndingStream}
                  >
                    <Radio className="w-4 h-4" />
                    {isEndingStream ? "Ending…" : "End stream"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End live stream?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Viewers will see the broadcast has ended. You can go live again anytime from
                      your profile.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void onEndStream()}
                    >
                      End stream
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {useCamera && !isPublishing && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Check your camera and microphone, then tap <strong>Go Live</strong> when you&rsquo;re
              ready. Viewers won&rsquo;t see you until then.
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 lg:hidden border-t border-border">
          <StudioChatPanel
            messages={chatMessages}
            messageInput={messageInput}
            onMessageInputChange={onMessageInputChange}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>

      <aside className="hidden lg:flex flex-col w-full lg:w-[400px] xl:w-[440px] shrink-0 border border-border rounded-xl bg-card/30 min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 font-semibold text-sm">
          <MessageSquare className="w-4 h-4 text-primary" />
          Live chat &amp; gifts
        </div>
        <StudioChatPanel
          messages={chatMessages}
          messageInput={messageInput}
          onMessageInputChange={onMessageInputChange}
          onSendMessage={onSendMessage}
          className="flex-1 min-h-0"
        />
      </aside>
    </div>
  )
}

function StudioChatPanel({
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  className,
}: {
  messages: ChatLine[]
  messageInput: string
  onMessageInputChange: (value: string) => void
  onSendMessage: () => void
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[120px]">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chat messages and gifts will appear here in real time.
          </p>
        ) : (
          messages.map((msg) => <StreamChatLine key={msg.id} msg={msg} />)
        )}
      </div>
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendMessage()
            }}
            placeholder="Reply to chat…"
            className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm min-w-0"
          />
          <button
            type="button"
            onClick={onSendMessage}
            disabled={!messageInput.trim()}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ObsStudioPlaceholder({
  stream,
  studio,
  onCopyRtmp,
  copiedRtmp,
}: {
  stream: StreamDetail
  studio: StreamStudioInfo | null | undefined
  onCopyRtmp?: () => void
  copiedRtmp?: boolean
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10 text-center bg-gradient-to-b from-zinc-900 to-zinc-950">
      <Monitor className="w-12 h-12 text-primary mb-4" />
      <h2 className="text-lg font-semibold text-white mb-2">Streaming via OBS</h2>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        Your live picture is in the <strong className="text-zinc-200">OBS preview</strong> window.
        Start streaming in OBS using the credentials below, then use this page for chat.
      </p>
      {studio && (
        <div className="w-full max-w-lg rounded-xl bg-black/40 border border-white/10 p-4 text-left font-mono text-xs text-zinc-300 space-y-2 mb-4">
          <p>
            <span className="text-zinc-500">Server:</span> {studio.rtmpUrl}
          </p>
          <p className="break-all">
            <span className="text-zinc-500">Stream key:</span> {studio.streamKey}
          </p>
        </div>
      )}
      {onCopyRtmp && studio && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full gap-2"
          onClick={onCopyRtmp}
        >
          {copiedRtmp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedRtmp ? "Copied" : "Copy OBS credentials"}
        </Button>
      )}
      {stream.status === "scheduled" && (
        <p className="text-xs text-amber-400/90 mt-4">Waiting for OBS to connect…</p>
      )}
    </div>
  )
}
