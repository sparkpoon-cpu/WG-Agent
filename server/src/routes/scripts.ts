import { Router, Request, Response } from 'express'
import { authMiddleware } from '../auth'
import { getDb } from '../db'
import { v4 as uuid } from 'uuid'

const router = Router()
router.use(authMiddleware)

// List scripts
router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  const scripts = db
    .prepare(
      `SELECT id, project_id as projectId, conversation_id as conversationId,
              user_id as userId, title, fountain_content as fountainContent,
              word_count as wordCount, current_version as currentVersion,
              created_at as createdAt, updated_at as updatedAt
       FROM scripts ORDER BY updated_at DESC`
    )
    .all()
  res.json(scripts)
})

// Get script
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const script = db
    .prepare(
      `SELECT id, project_id as projectId, conversation_id as conversationId,
              user_id as userId, title, fountain_content as fountainContent,
              word_count as wordCount, current_version as currentVersion,
              created_at as createdAt, updated_at as updatedAt
       FROM scripts WHERE id = ?`
    )
    .get(req.params.id)
  if (!script) {
    res.status(404).json({ error: 'Script not found' })
    return
  }
  res.json(script)
})

// Create script
router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { projectId, conversationId, title, fountainContent } = req.body
  const id = uuid()
  const now = new Date().toISOString()
  const content = fountainContent || ''
  const wordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length

  db.prepare(
    `INSERT INTO scripts (id, project_id, conversation_id, user_id, title, fountain_content, word_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId || null, conversationId || null, req.user!.id, title || 'Untitled Script', content, wordCount, now, now)

  const script = db
    .prepare(
      `SELECT id, project_id as projectId, conversation_id as conversationId,
              user_id as userId, title, fountain_content as fountainContent,
              word_count as wordCount, current_version as currentVersion,
              created_at as createdAt, updated_at as updatedAt
       FROM scripts WHERE id = ?`
    )
    .get(id)
  res.status(201).json(script)
})

// Update script
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { title, fountainContent, projectId, changeSummary } = req.body
  const now = new Date().toISOString()

  const current = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id) as any
  if (!current) {
    res.status(404).json({ error: 'Script not found' })
    return
  }

  // Save version if content changed
  if (fountainContent !== undefined && fountainContent !== current.fountain_content) {
    const newVersion = current.current_version + 1
    db.prepare(
      `INSERT INTO script_versions (id, script_id, version, fountain_content, change_summary)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuid(), req.params.id, newVersion, current.fountain_content, changeSummary || null)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (fountainContent !== undefined) {
    fields.push('fountain_content = ?')
    values.push(fountainContent)
    fields.push('word_count = ?')
    const wc = fountainContent.trim().split(/\s+/).filter((w: string) => w.length > 0).length
    values.push(wc)
    fields.push('current_version = current_version + 1')
  }
  if (projectId !== undefined) { fields.push('project_id = ?'); values.push(projectId) }

  if (fields.length > 0) {
    fields.push('updated_at = ?')
    values.push(now)
    values.push(req.params.id)
    db.prepare(`UPDATE scripts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }

  const script = db
    .prepare(
      `SELECT id, project_id as projectId, conversation_id as conversationId,
              user_id as userId, title, fountain_content as fountainContent,
              word_count as wordCount, current_version as currentVersion,
              created_at as createdAt, updated_at as updatedAt
       FROM scripts WHERE id = ?`
    )
    .get(req.params.id)
  res.json(script)
})

// Delete script
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM scripts WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Script not found' })
    return
  }
  res.json({ success: true })
})

// Get script versions
router.get('/:id/versions', (req: Request, res: Response) => {
  const db = getDb()
  const versions = db
    .prepare(
      `SELECT id, script_id as scriptId, version, fountain_content as fountainContent,
              change_summary as changeSummary, created_at as createdAt
       FROM script_versions
       WHERE script_id = ?
       ORDER BY version DESC`
    )
    .all(req.params.id)
  res.json(versions)
})

export default router
