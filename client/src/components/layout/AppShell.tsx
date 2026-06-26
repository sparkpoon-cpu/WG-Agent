import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../authStore'
import { MessageSquare, FileText, Settings, LogOut, Sun, Moon, Clapperboard } from 'lucide-react'
import { useTheme } from '../../App'
import { api } from '../../api'

export function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const [conversations, setConversations] = useState<any[]>([])
  const [scripts, setScripts] = useState<any[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const refreshData = useCallback(async () => {
    try {
      const [convs, scrs] = await Promise.all([api.listConversations(), api.listScripts()])
      setConversations(convs)
      setScripts(scrs)
    } catch (err) {
      console.error('加载列表失败:', err)
    }
  }, [])

  useEffect(() => { refreshData() }, [refreshData, location.pathname])

  const handleNewConversation = async (): Promise<void> => {
    const conv = await api.createConversation({ title: '新的对话' })
    await refreshData()
    navigate(`/chat/${conv.id}`)
  }

  const handleNewScript = async (): Promise<void> => {
    const script = await api.createScript({ title: '未命名剧本' })
    await refreshData()
    navigate(`/script/${script.id}`)
  }

  const handleDelete = async (type: string, id: string): Promise<void> => {
    if (type === 'conversation') {
      await api.deleteConversation(id)
      if (location.pathname === `/chat/${id}`) navigate('/')
    } else {
      await api.deleteScript(id)
      if (location.pathname === `/script/${id}`) navigate('/')
    }
    await refreshData()
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar — Apple-style minimal */}
      <header className="glass flex h-11 flex-shrink-0 items-center justify-between border-b px-5 select-none">
        <div className="flex items-center gap-2.5">
          <Clapperboard className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold tracking-tight text-foreground">WG Agent</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
            title="切换主题"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg p-2 text-muted-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
            title="设置"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <span className="mx-1.5 h-4 w-px bg-border" />
          <span className="text-[12px] text-muted-foreground/70 font-medium">{user?.username}</span>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all ml-0.5"
            title="退出登录"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — frosted glass */}
        <aside className="flex w-[220px] flex-shrink-0 flex-col border-r border-border/50 bg-secondary/25">
          <div className="flex items-center gap-1.5 px-4 py-3">
            <button
              onClick={handleNewConversation}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
              对话
            </button>
            <button
              onClick={handleNewScript}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/60 px-2.5 py-2 text-[12px] font-medium hover:bg-secondary active:scale-[0.97] transition-all"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              剧本
            </button>
          </div>

          <Sidebar
            conversations={conversations}
            scripts={scripts}
            onDelete={(type, id) => handleDelete(type, id)}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-background">{children}</main>
      </div>
    </div>
  )
}
