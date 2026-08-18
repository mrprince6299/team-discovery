"use client"

import * as React from "react"
import Image from "next/image"
import {
  Send,
  Loader2,
  Crown,
  ShieldCheck,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { WorkspaceMessage } from "@/app/actions/workspace"
import { sendTeamMessage } from "@/app/actions/workspace"
import { toast } from "sonner"
import { MembershipRole } from "@prisma/client"

interface WorkspaceChatProps {
  teamId: string
  initialMessages: WorkspaceMessage[]
  currentUserId: string
}

export function WorkspaceChat({
  teamId,
  initialMessages,
  currentUserId,
}: WorkspaceChatProps) {
  const [messages, setMessages] = React.useState<WorkspaceMessage[]>(initialMessages)
  const [inputContent, setInputContent] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  React.useEffect(() => {
    scrollToBottom("auto")
  }, [scrollToBottom])

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const content = inputContent.trim()
    if (!content || isPending) return

    startTransition(async () => {
      const res = await sendTeamMessage({ teamId, content })
      if (res.error) {
        toast.error(res.error)
      } else if (res.message) {
        setMessages((prev) => [...prev, res.message!])
        setInputContent("")
        setTimeout(() => scrollToBottom("smooth"), 50)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatMessageDate = (date: Date) => {
    const d = new Date(date)
    const today = new Date()
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()

    if (isToday) return "Today"
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  const getRoleBadge = (role: MembershipRole | null) => {
    if (role === "LEADER") {
      return (
        <Badge
          variant="outline"
          className="text-[10px] py-0 px-1.5 h-4 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5"
        >
          <Crown className="h-2.5 w-2.5" /> Leader
        </Badge>
      )
    }
    if (role === "CO_LEADER") {
      return (
        <Badge
          variant="outline"
          className="text-[10px] py-0 px-1.5 h-4 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-0.5"
        >
          <ShieldCheck className="h-2.5 w-2.5" /> Co-Leader
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] bg-card rounded-xl border border-border overflow-hidden shadow-xs">
      {/* Feed Sub-Header */}
      <div className="px-4 py-3 border-b border-border/80 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Team Conversation Feed
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
            <div className="relative w-full max-w-sm h-44 rounded-xl overflow-hidden shadow-xs border border-border/60">
              <Image
                src="/images/workspace-collab.jpg"
                alt="Collaboration Workspace"
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover"
              />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Welcome to your team feed!
              </h3>
              <p className="text-xs text-muted-foreground">
                Start the conversation with your squad mates. Brainstorm ideas, coordinate tasks, and align on deliverables.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setInputContent("👋 Hey squad! Excited to build together.")
                  textareaRef.current?.focus()
                }}
              >
                👋 Say Hello
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setInputContent("🚀 Let's align on tech stack and repo setup.")
                  textareaRef.current?.focus()
                }}
              >
                🚀 Discuss Tech Stack
              </Button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender.id === currentUserId
            const showDateDivider =
              index === 0 ||
              formatMessageDate(messages[index - 1].createdAt) !==
                formatMessageDate(msg.createdAt)

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-border/50" />
                    <span className="px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-card">
                      {formatMessageDate(msg.createdAt)}
                    </span>
                    <div className="flex-grow border-t border-border/50" />
                  </div>
                )}

                <div
                  className={`flex items-start gap-2.5 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0 border border-border shadow-xs">
                    <AvatarImage
                      src={msg.sender.avatarUrl || undefined}
                      alt={msg.sender.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {msg.sender.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-medium text-foreground">
                        {isMe ? "You" : msg.sender.name}
                      </span>
                      {getRoleBadge(msg.sender.membershipRole)}
                      <span className="text-[10px] text-muted-foreground">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed shadow-2xs ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Footer */}
      <div className="p-3 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to your squad... (Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={2000}
              className="resize-none pr-12 text-xs sm:text-sm py-2.5 focus-visible:ring-primary/40"
              aria-label="Message composer"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputContent.trim() || isPending}
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Send Message"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>
              Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px]">Enter</kbd> to send
            </span>
            <span>{inputContent.length}/2000</span>
          </div>
        </form>
      </div>
    </div>
  )
}
