import { Router, Request, Response } from 'express'
import { authMiddleware } from '../auth'
import { getDb } from '../db'
import OpenAI from 'openai'

const router = Router()
router.use(authMiddleware)

// Get DeepSeek API key from settings
function getApiKey(): string {
  const db = getDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as
    | { value: string }
    | undefined
  if (!row) return ''
  try {
    return JSON.parse(row.value) as string
  } catch {
    return ''
  }
}

// Non-streaming chat
router.post('/send', async (req: Request, res: Response) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured. Admin must set DeepSeek API key.' })
    return
  }

  const { messages, model, thinkingEnabled, reasoningEffort } = req.body

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com'
  })

  try {
    const completion = await client.chat.completions.create({
      model: model || 'deepseek-v4-pro',
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      ...(thinkingEnabled
        ? {
            thinking: { type: 'enabled' } as any,
            reasoning_effort: reasoningEffort || 'high'
          }
        : {})
    } as any)

    const choice = completion.choices[0]
    res.json({
      content: choice.message.content,
      reasoningContent: (choice.message as any).reasoning_content || null,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        reasoningTokens: (completion.usage as any)?.reasoning_tokens || 0
      }
    })
  } catch (error: any) {
    console.error('DeepSeek API error:', error.message)
    res.status(500).json({ error: error.message || 'API request failed' })
  }
})

// Streaming chat (SSE)
router.post('/stream', async (req: Request, res: Response) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' })
    return
  }

  const { messages, model, thinkingEnabled, reasoningEffort } = req.body

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com'
  })

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const stream = await client.chat.completions.create({
      model: model || 'deepseek-v4-pro',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
      ...(thinkingEnabled
        ? {
            thinking: { type: 'enabled' } as any,
            reasoning_effort: reasoningEffort || 'high'
          }
        : {})
    } as any)

    let contentAccum = ''
    let reasoningAccum = ''
    let promptTokens = 0
    let completionTokens = 0
    let reasoningTokens = 0

    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta
      if (delta?.content) {
        contentAccum += delta.content
        res.write(
          `data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`
        )
      }
      if (delta?.reasoning_content) {
        reasoningAccum += delta.reasoning_content
        res.write(
          `data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`
        )
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens || 0
        completionTokens = chunk.usage.completion_tokens || 0
        reasoningTokens = (chunk.usage as any).reasoning_tokens || 0
      }
    }

    // Send final usage data
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        usage: { promptTokens, completionTokens, reasoningTokens }
      })}\n\n`
    )
    res.end()
  } catch (error: any) {
    console.error('Stream error:', error.message)
    res.write(
      `data: ${JSON.stringify({ type: 'error', error: error.message || 'Stream failed' })}\n\n`
    )
    res.end()
  }
})

export default router
