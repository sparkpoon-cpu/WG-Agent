import { create } from 'zustand'
import { api } from './api'

const DEFAULT_SYSTEM_PROMPT = `你是一位专业的影视编剧助手，拥有丰富的电影电视剧本创作经验。

你的专业能力包括：
- 故事结构设计（三幕式结构、救猫咪节拍表、英雄之旅等）
- 角色塑造与人物弧光
- 场景构建与节奏把控
- 对白写作
- 类型片规律与创新
- Fountain 剧本格式

当用户要求写剧本或场景时，请始终使用 Fountain 格式在 \`\`\`fountain 代码块中输出。示例：

\`\`\`fountain
INT. 咖啡店 - 日

简（30多岁，文艺气质，略显疲惫）坐在角落的桌前，笔记本电脑开着。咖啡一口没喝。

简
（自言自语）
来吧。一个好点子就行。

门开了。马克走进来，扫视着店内。

马克
简？是你吗？

简
（抬头，惊讶地）
马克。已经……好多年了。
\`\`\`

Fountain 格式要点：
- 场景标题 ALL CAPS
- 角色名居中显示在对话前
- 括号说明用 (parentheses)
- 转场如 CUT TO:
- 章节标题用 # 开头

请保持协作、创意、支持的态度。需要时主动提问以明确需求。帮助编剧找到故事的最佳版本。`

interface ChatState {
  messages: any[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  streamingReasoning: string
  error: string | null
  abortController: AbortController | null

  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  stopStreaming: () => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',
  error: null,
  abortController: null,

  loadMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const msgs = await api.listMessages(conversationId)
      set({ messages: msgs, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    const { messages } = get()
    if (!content.trim()) return

    const userMsg = await api.addMessage({
      conversationId,
      role: 'user',
      content: content.trim()
    })
    const updatedMessages = [...messages, userMsg]
    set({
      messages: updatedMessages,
      error: null,
      isStreaming: true,
      streamingContent: '',
      streamingReasoning: ''
    })

    const abortController = new AbortController()
    set({ abortController })

    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ...updatedMessages.map((m: any) => ({ role: m.role, content: m.content }))
    ]

    let finalContent = ''
    let finalReasoning = ''
    let finalUsage = { promptTokens: 0, completionTokens: 0, reasoningTokens: 0 }

    try {
      await api.streamChat(
        { messages: apiMessages, thinkingEnabled: true, reasoningEffort: 'high' },
        {
          onContent: (text) => {
            finalContent = text
            set({ streamingContent: text })
          },
          onReasoning: (text) => {
            finalReasoning = text
            set({ streamingReasoning: text })
          },
          onDone: (usage) => {
            finalUsage = usage
          },
          onError: (err) => {
            set({ error: err, isStreaming: false })
          }
        }
      )
    } catch (err: any) {
      set({ error: err.message, isStreaming: false })
      return
    }

    if (finalContent || finalReasoning) {
      try {
        const assistantMsg = await api.addMessage({
          conversationId,
          role: 'assistant',
          content: finalContent || '（空回复）',
          reasoningContent: finalReasoning || undefined,
          promptTokens: finalUsage.promptTokens,
          completionTokens: finalUsage.completionTokens
        })
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          isStreaming: false,
          streamingContent: '',
          streamingReasoning: '',
          abortController: null
        }))
      } catch (err: any) {
        set({ error: err.message, isStreaming: false })
      }
    } else {
      set({ isStreaming: false, abortController: null })
    }
  },

  stopStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({ isStreaming: false, abortController: null })
    }
  },

  clearError: () => set({ error: null })
}))
