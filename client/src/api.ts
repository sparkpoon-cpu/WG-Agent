// REST API client - replaces Electron IPC

const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('wg-auth-token')
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// Auth
export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; isAdmin: boolean } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  getMe: () =>
    request<{ id: string; username: string; isAdmin: boolean }>('/auth/me'),

  createUser: (username: string, password: string) =>
    request<{ username: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  listUsers: () =>
    request<Array<{ id: string; username: string; isAdmin: boolean; createdAt: string }>>('/auth/users'),

  // Projects
  listProjects: () =>
    request<Array<{ id: string; name: string; description: string; color: string; sortOrder: number }>>('/projects'),

  createProject: (params: { name: string; description?: string; color?: string }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(params) }),

  updateProject: (id: string, params: { name?: string; description?: string; color?: string }) =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(params) }),

  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  // Conversations
  listConversations: () =>
    request<Array<any>>('/conversations'),

  getConversation: (id: string) =>
    request<any>(`/conversations/${id}`),

  createConversation: (params: { projectId?: string; title?: string; model?: string; systemPrompt?: string }) =>
    request<any>('/conversations', { method: 'POST', body: JSON.stringify(params) }),

  updateConversation: (id: string, params: any) =>
    request(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(params) }),

  deleteConversation: (id: string) =>
    request(`/conversations/${id}`, { method: 'DELETE' }),

  // Messages
  listMessages: (conversationId: string) =>
    request<Array<any>>(`/messages/${conversationId}`),

  addMessage: (params: { conversationId: string; role: string; content: string; reasoningContent?: string; promptTokens?: number; completionTokens?: number }) =>
    request('/messages', { method: 'POST', body: JSON.stringify(params) }),

  // Scripts
  listScripts: () =>
    request<Array<any>>('/scripts'),

  getScript: (id: string) =>
    request<any>(`/scripts/${id}`),

  createScript: (params: { projectId?: string; conversationId?: string; title?: string; fountainContent?: string }) =>
    request('/scripts', { method: 'POST', body: JSON.stringify(params) }),

  updateScript: (id: string, params: any) =>
    request(`/scripts/${id}`, { method: 'PATCH', body: JSON.stringify(params) }),

  deleteScript: (id: string) =>
    request(`/scripts/${id}`, { method: 'DELETE' }),

  getScriptVersions: (scriptId: string) =>
    request(`/scripts/${scriptId}/versions`),

  // Settings
  getSettings: () =>
    request<Record<string, any>>('/settings'),

  getSetting: (key: string) =>
    request<{ key: string; value: any }>(`/settings/${key}`),

  updateSetting: (key: string, value: any) =>
    request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  // Chat - streaming
  async streamChat(
    body: { messages: Array<{ role: string; content: string }>; model?: string; thinkingEnabled?: boolean; reasoningEffort?: string },
    callbacks: {
      onContent: (text: string) => void
      onReasoning: (text: string) => void
      onDone: (usage: { promptTokens: number; completionTokens: number; reasoningTokens: number }) => void
      onError: (error: string) => void
    }
  ): Promise<void> {
    const token = getToken()
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Stream failed' }))
      callbacks.onError(err.error || 'Stream failed')
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let contentAccum = ''
    let reasoningAccum = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          switch (data.type) {
            case 'content':
              contentAccum += data.content
              callbacks.onContent(contentAccum)
              break
            case 'reasoning':
              reasoningAccum += data.content
              callbacks.onReasoning(reasoningAccum)
              break
            case 'done':
              callbacks.onDone(data.usage)
              break
            case 'error':
              callbacks.onError(data.error)
              break
          }
        }
      }
    }
  }
}
