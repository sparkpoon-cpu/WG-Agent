import { Router, Request, Response } from 'express'
import { authMiddleware } from '../auth'
import { getDb } from '../db'
import { v4 as uuid } from 'uuid'

const router = Router()
router.use(authMiddleware)

// List conversations
router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const conversations = db
    .prepare(
      `SELECT id, project_id as projectId, user_id as userId, title, model,
              system_prompt as systemPrompt, is_pinned as isPinned,
              created_at as createdAt, updated_at as updatedAt
       FROM conversations
       ORDER BY is_pinned DESC, updated_at DESC`
    )
    .all()
  res.json(conversations)
})

// Get conversation
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const conv = db
    .prepare(
      `SELECT id, project_id as projectId, user_id as userId, title, model,
              system_prompt as systemPrompt, is_pinned as isPinned,
              created_at as createdAt, updated_at as updatedAt
       FROM conversations WHERE id = ?`
    )
    .get(req.params.id)
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.json(conv)
})

// Create conversation
router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { projectId, title, model, systemPrompt } = req.body
  const id = uuid()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO conversations (id, project_id, user_id, title, model, system_prompt, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId || null, req.user!.id, title || 'New Conversation', model || 'deepseek-v4-pro', systemPrompt || '', now, now)
  const conv = db
    .prepare('SELECT id, project_id as projectId, title, model, system_prompt as systemPrompt, is_pinned as isPinned, created_at as createdAt, updated_at as updatedAt FROM conversations WHERE id = ?')
    .get(id)
  res.status(201).json(conv)
})

// Update conversation
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { title, model, systemPrompt, isPinned, projectId } = req.body
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (model !== undefined) { fields.push('model = ?'); values.push(model) }
  if (systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(systemPrompt) }
  if (isPinned !== undefined) { fields.push('is_pinned = ?'); values.push(isPinned ? 1 : 0) }
  if (projectId !== undefined) { fields.push('project_id = ?'); values.push(projectId) }

  if (fields.length > 0) {
    fields.push('updated_at = ?')
    values.push(now)
    values.push(req.params.id)
    db.prepare(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }

  const conv = db
    .prepare('SELECT id, project_id as projectId, title, model, system_prompt as systemPrompt, is_pinned as isPinned, created_at as createdAt, updated_at as updatedAt FROM conversations WHERE id = ?')
    .get(req.params.id)
  res.json(conv)
})

// Delete conversation
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.json({ success: true })
})

export default router
