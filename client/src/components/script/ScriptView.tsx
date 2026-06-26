import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Eye, Edit3 } from 'lucide-react'
import { api } from '../../api'

export function ScriptView(): React.ReactElement {
  const { scriptId } = useParams<{ scriptId: string }>()
  const navigate = useNavigate()
  const [script, setScript] = useState<any>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split')
  const [isDirty, setIsDirty] = useState(false)
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    if (!scriptId) return
    api.getScript(scriptId).then((s: any) => {
      setScript(s)
      setContent(s.fountainContent || '')
      setTitle(s.title || '')
    })
  }, [scriptId])

  const saveContent = useCallback(
    async (c: string, t?: string) => {
      if (!scriptId) return
      await api.updateScript(scriptId, { fountainContent: c, title: t !== undefined ? t : title })
      setIsDirty(false)
    },
    [scriptId, title]
  )

  const handleChange = useCallback(
    (c: string) => {
      setContent(c)
      setIsDirty(true)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveContent(c), 1000)
    },
    [saveContent]
  )

  return (
    <div className="flex h-full flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-muted-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveContent(content, title)}
          className="flex-1 bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground/30"
          placeholder="剧本标题"
        />
        {/* 视图模式切换 */}
        <div className="flex rounded-xl border border-border/60 overflow-hidden">
          {([
            ['edit', '编辑'],
            ['split', '分屏'],
            ['preview', '预览']
          ] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-all ${
                mode === m
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50'
              } ${m !== 'preview' ? 'border-r border-border/40' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* 导出按钮 */}
        <button
          onClick={() => {
            const blob = new Blob([renderFountainHtml(content)], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${title || '剧本'}.html`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-all"
          title="导出 HTML"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {isDirty && (
          <span className="text-[11px] text-amber-500 font-medium">未保存</span>
        )}
      </div>

      {/* 编辑区 */}
      <div className="flex-1 overflow-hidden">
        {mode === 'edit' && (
          <ScriptEditor content={content} onChange={handleChange} />
        )}
        {mode === 'split' && (
          <div className="flex h-full">
            <div className="flex-1 border-r border-border/40">
              <ScriptEditor content={content} onChange={handleChange} />
            </div>
            <div className="flex-1 overflow-y-auto bg-white/60 dark:bg-neutral-900/60">
              <ScriptPreview content={content} />
            </div>
          </div>
        )}
        {mode === 'preview' && (
          <div className="h-full overflow-y-auto bg-white/60 dark:bg-neutral-900/60">
            <ScriptPreview content={content} />
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center gap-4 border-t border-border/40 px-5 py-1.5">
        <span className="text-[11px] text-muted-foreground/50">
          {countWords(content)} 字
        </span>
        <span className="text-[11px] text-muted-foreground/50">
          约 {(countWords(content) / 250).toFixed(1)} 页
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-muted-foreground/40">
          Fountain 剧本格式
        </span>
      </div>
    </div>
  )
}

/* ==========================================
   ScriptEditor — Fountain 编辑器
   ========================================== */
function ScriptEditor({
  content,
  onChange
}: {
  content: string
  onChange: (c: string) => void
}): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insert = (template: string): void => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newContent = content.substring(0, start) + template + content.substring(end)
    onChange(newContent)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + template.length, start + template.length)
    }, 0)
  }

  const tools = [
    { label: '场景', template: 'INT.  - \n\n', title: '插入场景标题' },
    { label: '角色', template: '\n角色名\n', title: '插入角色' },
    { label: '括号', template: '\n()\n', title: '插入括号说明' },
    { label: '转场', template: '\nCUT TO:\n\n', title: '插入转场' },
    { label: '居中', template: '\n>  <\n', title: '插入居中文字' }
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Fountain 工具栏 */}
      <div className="flex items-center gap-0.5 border-b border-border/40 px-3 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => insert(tool.template)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-all"
            title={tool.title}
          >
            {tool.label}
          </button>
        ))}
        <span className="flex-1" />
        <span className="text-[10px] text-muted-foreground/30 pr-2 font-medium">
          FOUNTAIN
        </span>
      </div>

      {/* 编辑区 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="script-editor flex-1 resize-none bg-transparent px-5 py-4 text-foreground outline-none placeholder:text-muted-foreground/20"
        placeholder={`INT. 咖啡店 - 日\n\n角色名\n在这里输入对话...\n\nCUT TO:\n\nEXT. 公园 - 傍晚\n\n动作描写...`}
        spellCheck
      />
    </div>
  )
}

/* ==========================================
   ScriptPreview — 剧本渲染预览
   ========================================== */
function ScriptPreview({ content }: { content: string }): React.ReactElement {
  const html = renderFountainHtml(content)
  return (
    <div className="script-preview">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {!content.trim() && (
        <p className="text-muted-foreground/30 text-sm italic text-center mt-10">
          在左侧编辑器中开始写作，这里会实时显示剧本预览
        </p>
      )}
    </div>
  )
}

/* ==========================================
   Fountain → HTML 渲染
   ========================================== */
function renderFountainHtml(text: string): string {
  if (!text.trim()) return ''
  const lines = text.split('\n')
  const result: string[] = []
  let inDialogue = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      result.push('<p class="blank-line">&nbsp;</p>')
      inDialogue = false
      continue
    }

    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(trimmed)) {
      result.push(`<p class="fountain-scene-heading">${escapeHtml(trimmed)}</p>`)
      inDialogue = false
    } else if (/^(CUT TO:|FADE (?:IN|OUT)|DISSOLVE TO:|SMASH CUT TO:)/i.test(trimmed)) {
      result.push(`<p class="fountain-transition">${escapeHtml(trimmed)}</p>`)
      inDialogue = false
    } else if (trimmed.startsWith('>') && trimmed.endsWith('<')) {
      result.push(`<p class="fountain-centered">${escapeHtml(trimmed.slice(1, -1))}</p>`)
      inDialogue = false
    } else if (
      /^[A-Z][A-Z0-9一-鿿\s\-\(\)']*$/.test(trimmed) &&
      trimmed === trimmed.toUpperCase() &&
      trimmed.length < 50
    ) {
      result.push(`<p class="fountain-character">${escapeHtml(trimmed)}</p>`)
      inDialogue = true
    } else if (inDialogue && /^\(.*\)$/.test(trimmed)) {
      result.push(`<p class="fountain-parenthetical">${escapeHtml(trimmed)}</p>`)
    } else if (inDialogue) {
      result.push(`<p class="fountain-dialogue">${escapeHtml(trimmed)}</p>`)
    } else if (trimmed.startsWith('#')) {
      const level = Math.min(trimmed.match(/^#+/)![0].length, 3)
      result.push(
        `<p class="fountain-section" style="font-size: ${1.4 - level * 0.15}em">${escapeHtml(trimmed.replace(/^#+\s*/, ''))}</p>`
      )
    } else {
      result.push(`<p class="fountain-action">${escapeHtml(trimmed)}</p>`)
      inDialogue = false
    }
  }
  return result.join('\n')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}
