import { useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare, FileText, Trash2 } from 'lucide-react'

interface SidebarProps {
  conversations: any[]
  scripts: any[]
  onDelete: (type: string, id: string) => void
}

export function Sidebar({ conversations, scripts, onDelete }: SidebarProps): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-1">
      {/* 对话列表 */}
      <div className="mb-4">
        <div className="mb-1.5 px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/50">
            对话
          </span>
        </div>
        {conversations.length === 0 ? (
          <p className="px-2.5 text-[12px] text-muted-foreground/40 italic">暂无对话</p>
        ) : (
          conversations.map((conv: any) => {
            const active = location.pathname === `/chat/${conv.id}`
            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-all ${
                  active
                    ? 'bg-secondary/80 text-foreground font-medium'
                    : 'text-muted-foreground/70 hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" strokeWidth={1.5} />
                <span className="truncate flex-1">{conv.title}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); onDelete('conversation', conv.id) }}
                  className="cursor-pointer opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* 剧本列表 */}
      <div>
        <div className="mb-1.5 px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/50">
            剧本
          </span>
        </div>
        {scripts.length === 0 ? (
          <p className="px-2.5 text-[12px] text-muted-foreground/40 italic">暂无剧本</p>
        ) : (
          scripts.map((script: any) => {
            const active = location.pathname === `/script/${script.id}`
            return (
              <button
                key={script.id}
                onClick={() => navigate(`/script/${script.id}`)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-all ${
                  active
                    ? 'bg-secondary/80 text-foreground font-medium'
                    : 'text-muted-foreground/70 hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0 opacity-60" strokeWidth={1.5} />
                <span className="truncate flex-1">{script.title}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); onDelete('script', script.id) }}
                  className="cursor-pointer opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
