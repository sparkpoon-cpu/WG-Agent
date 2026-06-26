import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { useChatStore } from '../../chatStore'
import { Loader2, Sparkles } from 'lucide-react'

interface Props {
  messages: any[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: Props): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { isStreaming, streamingContent, streamingReasoning } = useChatStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 && !isStreaming ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Sparkles className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] text-muted-foreground/70 max-w-md leading-relaxed">
            描述你的故事创意、角色设定，或者直接让 AI 帮你写一场戏
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground/40">
            AI 会以 Fountain 格式输出剧本
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-1 px-5 py-6">
          {messages.map((msg: any) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                reasoningContent: streamingReasoning || null,
                createdAt: new Date().toISOString()
              }}
              isStreaming
            />
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
