import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChatStore } from '../../chatStore'
import { api } from '../../api'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ArrowLeft } from 'lucide-react'

export function ChatView(): React.ReactElement {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { messages, isLoading, isStreaming, loadMessages, sendMessage, stopStreaming } = useChatStore()
  const [convTitle, setConvTitle] = useState('')

  useEffect(() => {
    if (!conversationId) return
    loadMessages(conversationId)
    api.getConversation(conversationId).then((c: any) => setConvTitle(c?.title || ''))
  }, [conversationId, loadMessages])

  const handleSend = useCallback(
    (content: string) => {
      if (!conversationId) return
      sendMessage(conversationId, content)
    },
    [conversationId, sendMessage]
  )

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 对话标题栏 */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-muted-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          value={convTitle}
          onChange={(e) => setConvTitle(e.target.value)}
          onBlur={() => {
            if (conversationId && convTitle.trim()) {
              api.updateConversation(conversationId, { title: convTitle.trim() })
            }
          }}
          className="flex-1 bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground/30"
          placeholder="对话标题"
        />
      </div>

      {/* 消息列表 */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* 输入框 */}
      <ChatInput onSend={handleSend} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  )
}
