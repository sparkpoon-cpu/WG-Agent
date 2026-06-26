import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './authStore'
import { LoginPage } from './components/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { WelcomeScreen } from './components/layout/WelcomeScreen'
import { ChatView } from './components/chat/ChatView'
import { ScriptView } from './components/script/ScriptView'
import { SettingsView } from './components/settings/SettingsView'

function ProtectedRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <WelcomeScreen />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChatView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/script/:scriptId"
        element={
          <ProtectedRoute>
            <AppShell>
              <ScriptView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <SettingsView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('wg-theme') as 'light' | 'dark' | 'system') || 'system'
  )

  useEffect(() => {
    const apply = (t: string): void => {
      const root = document.documentElement
      if (t === 'dark') root.classList.add('dark')
      else if (t === 'light') root.classList.remove('dark')
      else {
        root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }
    apply(theme)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => {
      if (theme === 'system') document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

import { createContext, useContext } from 'react'
interface ThemeCtx {
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void
}
export const ThemeContext = createContext<ThemeCtx>({ theme: 'system', setTheme: () => {} })
export const useTheme = (): ThemeCtx => useContext(ThemeContext)

export default function App(): React.ReactElement {
  const { checkAuth, isAuthenticated } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    checkAuth().finally(() => setReady(true))
  }, [checkAuth])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  )
}
