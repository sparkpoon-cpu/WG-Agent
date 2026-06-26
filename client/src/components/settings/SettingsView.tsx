import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Check, AlertCircle, Loader2, Plus } from 'lucide-react'
import { api } from '../../api'
import { useAuthStore } from '../../authStore'
import { useTheme } from '../../App'

export function SettingsView(): React.ReactElement {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [addUser, setAddUser] = useState({ username: '', password: '' })
  const [addMsg, setAddMsg] = useState('')
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState(false)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {})
  }, [])

  const handleTestApiKey = async (): Promise<void> => {
    const key = apiKeyInput || settings.api_key
    if (!key) {
      setTestResult('error')
      setTestMessage('请先输入 API Key')
      return
    }
    setTesting(true)
    setTestResult('idle')
    try {
      await api.updateSetting('api_key', key)
      const res = await fetch('https://api.deepseek.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` }
      })
      if (res.ok) {
        setTestResult('success')
        setTestMessage('连接成功！API Key 已保存')
        setApiKeyInput('')
      } else {
        setTestResult('error')
        setTestMessage(`API Key 无效 (${res.status})`)
      }
    } catch (err: any) {
      setTestResult('error')
      setTestMessage(err.message || '连接失败')
    } finally {
      setTesting(false)
    }
  }

  const handleAddUser = async (): Promise<void> => {
    if (!addUser.username || !addUser.password) {
      setAddMsg('请填写用户名和密码')
      return
    }
    try {
      await api.createUser(addUser.username, addUser.password)
      setAddMsg(`成员「${addUser.username}」创建成功！`)
      setAddUser({ username: '', password: '' })
    } catch (err: any) {
      setAddMsg(err.message || '创建失败')
    }
  }

  const handleChangePassword = async (): Promise<void> => {
    const { current, new: newPwd, confirm } = pwdForm
    if (!current || !newPwd || !confirm) {
      setPwdMsg('请填写所有字段')
      setPwdErr(true)
      return
    }
    if (newPwd !== confirm) {
      setPwdMsg('两次输入的新密码不一致')
      setPwdErr(true)
      return
    }
    if (newPwd.length < 3) {
      setPwdMsg('新密码至少 3 位')
      setPwdErr(true)
      return
    }
    try {
      const res = await api.changePassword(current, newPwd)
      setPwdMsg(res.message || '密码修改成功')
      setPwdErr(false)
      setPwdForm({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      setPwdMsg(err.message || '修改失败')
      setPwdErr(true)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-muted-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <h2 className="text-[14px] font-semibold text-foreground">设置</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl space-y-10 px-8 py-10">

          {/* API Key — 仅管理员 */}
          {user?.isAdmin && (
            <section className="space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">DeepSeek API Key</h3>
                <p className="mt-1 text-[13px] text-muted-foreground/60">
                  团队共用的 API 密钥，配置后所有成员均可使用
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={settings.api_key ? '••••••••（已配置）' : 'sk-...'}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 pr-10 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestApiKey}
                  disabled={testing}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-[13px] font-medium hover:bg-secondary active:scale-[0.97] disabled:opacity-50 transition-all shadow-sm"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : '测试并保存'}
                </button>
              </div>
              {testResult !== 'idle' && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] ${
                    testResult === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {testResult === 'success' ? (
                    <Check className="h-4 w-4 mt-0.5" strokeWidth={1.5} />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5" strokeWidth={1.5} />
                  )}
                  {testMessage}
                </div>
              )}
            </section>
          )}

          {/* 主题 */}
          <section className="space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">外观</h3>
              <p className="mt-1 text-[13px] text-muted-foreground/60">选择界面主题</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['light', '☀️ 浅色'],
                ['dark', '🌙 深色'],
                ['system', '💻 跟随系统']
              ] as const).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t)
                    localStorage.setItem('wg-theme', t)
                  }}
                  className={`rounded-xl border px-4 py-3 text-[13px] font-medium transition-all active:scale-[0.97] ${
                    theme === t
                      ? 'border-primary/30 bg-primary/5 text-primary shadow-sm'
                      : 'border-border bg-card hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* 修改密码 */}
          <section className="space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">修改密码</h3>
              <p className="mt-1 text-[13px] text-muted-foreground/60">修改当前登录账号的密码</p>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                value={pwdForm.current}
                onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                placeholder="当前密码"
                className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pwdForm.new}
                  onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
                  placeholder="新密码"
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
                />
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  placeholder="确认新密码"
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-sm"
              >
                修改密码
              </button>
              {pwdMsg && (
                <p className={`text-[13px] ${pwdErr ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {pwdMsg}
                </p>
              )}
            </div>
          </section>

          {/* 团队管理 — 仅管理员 */}
          {user?.isAdmin && (
            <section className="space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">团队成员</h3>
                <p className="mt-1 text-[13px] text-muted-foreground/60">
                  添加团队成员账号，他们即可登录使用
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addUser.username}
                  onChange={(e) => setAddUser({ ...addUser, username: e.target.value })}
                  placeholder="用户名"
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
                />
                <input
                  type="password"
                  value={addUser.password}
                  onChange={(e) => setAddUser({ ...addUser, password: e.target.value })}
                  placeholder="密码"
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-[13px] outline-none transition-all focus:border-ring/30 focus:bg-background focus:ring-2 focus:ring-ring/5"
                />
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                  添加
                </button>
              </div>
              {addMsg && (
                <p className={`text-[13px] ${addMsg.includes('成功') ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                  {addMsg}
                </p>
              )}
            </section>
          )}

          {/* 关于 */}
          <section className="rounded-2xl border border-border/50 bg-secondary/20 p-5">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-foreground">WG Agent v1.0</p>
              <p className="text-[12px] text-muted-foreground/50">
                基于 DeepSeek API · 数据存储于本地服务器
              </p>
              <p className="text-[12px] text-muted-foreground/50">
                当前登录：<span className="font-medium text-foreground/70">{user?.username}</span>
                {user?.isAdmin && (
                  <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    管理员
                  </span>
                )}
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
