import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, ChevronDown, ChevronUp, Copy, Check, User } from 'lucide-react'
import { api } from '../../api'

interface Props {
  message: {
    id: string
    role: string
    content: string
    reasoningContent?: string | null
    conversationId?: string
    createdAt?: string
  }
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: Props): React.ReactElement {
  const isUser = message.role === 'user'
  const [showReasoning, setShowReasoning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExtractScript = async (): Promise<void> => {
    const fountainRegex = /```(?:fountain)?\s*\n([\s\S]*?)```/g
    let match
    while ((match = fountainRegex.exec(message.content)) !== null) {
      const fountainContent = match[1].trim()
      if (fountainContent) {
        await api.createScript({
          title: '提取的剧本',
          conversationId: message.conversationId,
          fountainContent
        })
      }
    }
  }

  return (
    <div className={`flex gap-3 py-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* 头像 */}
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary text-foreground/70'
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </div>

      {/* 内容 */}
      <div className={`flex-1 space-y-2 ${isUser ? 'flex flex-col items-end' : ''} max-w-[85%]`}>
        {/* 思考过程 */}
        {message.reasoningContent && (
          <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-secondary/20 shadow-sm">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-medium text-muted-foreground/70 hover:bg-secondary/30 transition-colors"
            >
              <span>🤔 思考过程</span>
              <span className="flex-1" />
              {showReasoning ? (
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>
            {showReasoning && (
              <div className="border-t border-border/30 px-4 py-3">
                <p className="text-[12px] text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {message.reasoningContent}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 消息正文 */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary/8 text-foreground'
              : 'text-foreground'
          }`}
        >
          {isUser ? (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={`prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: any) {
                    const codeStr = String(children).replace(/\n$/, '')
                    const isFountain =
                      className?.includes('language-fountain') ||
                      codeStr.includes('INT.') ||
                      codeStr.includes('EXT.')
                    const match = /language-(\w+)/.exec(className || '')
                    if (match || isFountain) {
                      return (
                        <div className="group relative my-4 rounded-xl border border-border/60 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between bg-secondary/50 px-4 py-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/50">
                              {isFountain ? '📜 FOUNTAIN 剧本' : match?.[1]?.toUpperCase() || '代码'}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => navigator.clipboard.writeText(codeStr)}
                                className="rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-background transition-all"
                                title="复制"
                              >
                                <Copy className="h-3 w-3" strokeWidth={1.5} />
                              </button>
                              {isFountain && (
                                <button
                                  onClick={handleExtractScript}
                                  className="rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-background transition-all"
                                  title="提取到剧本编辑器"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <pre className="overflow-x-auto bg-secondary/20 p-4">
                            <code className="text-[13px] leading-relaxed font-mono">{codeStr}</code>
                          </pre>
                        </div>
                      )
                    }
                    return (
                      <code className="rounded-md bg-secondary px-1.5 py-0.5 text-[12px] font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content || (isStreaming ? '' : '（空）')}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-all"
              title="复制"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" strokeWidth={1.5} />
              ) : (
                <Copy className="h-3 w-3" strokeWidth={1.5} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
