import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../authStore'
import { Clapperboard, Loader2, Eye, EyeOff } from 'lucide-react'

export function LoginPage(): React.ReactElement {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm animate-fade-in px-8">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 shadow-sm">
            <Clapperboard className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">WG Agent</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            团队 AI 编剧助手
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              required
              autoFocus
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
            />
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 pr-10 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/8 px-4 py-2.5 text-[13px] text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 text-[14px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              '登录'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-muted-foreground/60">
          WG Agent · 团队剧本创作助手
        </p>
      </div>
    </div>
  )
}
