import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Square } from 'lucide-react'

interface Props {
  onSend: (content: string) => void
  onStop: () => void
  isStreaming: boolean
}

export function ChatInput({ onSend, onStop, isStreaming }: Props): React.ReactElement {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [input])

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return
    onSend(input.trim())
    setInput('')
  }, [input, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === 'Escape' && isStreaming) onStop()
    },
    [handleSend, isStreaming, onStop]
  )

  return (
    <div className="border-t border-border/40 px-5 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-secondary/30 px-2 py-2 transition-all focus-within:border-ring/30 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/5 focus-within:shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'AI 正在生成回复...'
                : '输入消息...（Enter 发送，Shift+Enter 换行）'
            }
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/35 disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex-shrink-0 rounded-xl bg-destructive/90 p-2.5 text-white hover:bg-destructive active:scale-95 transition-all shadow-sm"
              title="停止生成 (Esc)"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-20 transition-all shadow-sm"
              title="发送消息 (Enter)"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
          AI 生成内容仅供参考，请核实关键信息
        </p>
      </div>
    </div>
  )
}
