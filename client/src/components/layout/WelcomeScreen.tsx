import { useNavigate } from 'react-router-dom'
import { MessageSquare, FileText, Clapperboard, Sparkles, Command } from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { api } from '../../api'

export function WelcomeScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleNewConversation = async (): Promise<void> => {
    const conv = await api.createConversation({ title: '新的对话' })
    navigate(`/chat/${conv.id}`)
  }

  const handleNewScript = async (): Promise<void> => {
    const script = await api.createScript({ title: '未命名剧本' })
    navigate(`/script/${script.id}`)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 animate-fade-in">
      {/* 问候语 */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/6 shadow-sm">
          <Clapperboard className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          欢迎回来{user?.username ? `，${user.username}` : ''}
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground/80 max-w-sm leading-relaxed">
          与 AI 对话，撰写剧本、构思故事、打磨角色，一切从下方开始
        </p>
      </div>

      {/* 快捷操作卡 */}
      <div className="grid grid-cols-2 gap-3 mb-12 w-full max-w-md">
        <button
          onClick={handleNewConversation}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
            <MessageSquare className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground">开始对话</p>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">与 AI 交流创意</p>
          </div>
        </button>

        <button
          onClick={handleNewScript}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground">新建剧本</p>
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">直接撰写 Fountain 剧本</p>
          </div>
        </button>
      </div>

      {/* 提示卡片 */}
      <div className="max-w-md w-full rounded-2xl border border-border/50 bg-secondary/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/50">使用技巧</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { key: 'Fountain 格式', desc: 'AI 输出标准剧本格式，可直接导入专业软件' },
            { key: 'Enter 发送', desc: '按 Enter 键发送消息，Shift+Enter 换行' },
            { key: 'Esc 暂停', desc: 'AI 生成过程中按 Esc 键可随时停止' },
            { key: '一键提取', desc: '对话中的剧本可一键提取到编辑器' }
          ].map((tip) => (
            <div key={tip.key} className="flex items-start gap-2">
              <Command className="h-3 w-3 mt-0.5 text-muted-foreground/40 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[12px] font-medium text-foreground/80">{tip.key}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
