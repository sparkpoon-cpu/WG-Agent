import { Router, Request, Response } from 'express'
import { authMiddleware } from '../auth'
import { getDb } from '../db'
import { v4 as uuid } from 'uuid'

const router = Router()
router.use(authMiddleware)

// List messages for a conversation
router.get('/:conversationId', (req: Request, res: Response) => {
  const db = getDb()
  const messages = db
    .prepare(
      `SELECT id, conversation_id as conversationId, role, content,
              reasoning_content as reasoningContent,
              prompt_tokens as promptTokens, completion_tokens as completionTokens,
              created_at as createdAt
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`
    )
    .all(req.params.conversationId)
  res.json(messages)
})

// Add message
router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { conversationId, role, content, reasoningContent, promptTokens, completionTokens } = req.body
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, reasoning_content, prompt_tokens, completion_tokens, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, conversationId, role, content, reasoningContent || null, promptTokens || 0, completionTokens || 0, now)

  // Touch conversation
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId)

  const msg = db
    .prepare(
      `SELECT id, conversation_id as conversationId, role, content,
              reasoning_content as reasoningContent,
              prompt_tokens as promptTokens, completion_tokens as completionTokens,
              created_at as createdAt
       FROM messages WHERE id = ?`
    )
    .get(id)
  res.status(201).json(msg)
})

export default router
