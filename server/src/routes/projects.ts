import { Router, Request, Response } from 'express'
import { authMiddleware } from '../auth'
import { getDb } from '../db'
import { v4 as uuid } from 'uuid'

const router = Router()
router.use(authMiddleware)

router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  const projects = db
    .prepare(
      'SELECT id, name, description, color, sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt FROM projects ORDER BY sort_order'
    )
    .all()
  res.json(projects)
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { name, description, color } = req.body
  const id = uuid()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO projects (id, name, description, color, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, description || '', color || '#6366f1', req.user!.id, now, now)
  const project = db
    .prepare('SELECT id, name, description, color, sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = ?')
    .get(id)
  res.status(201).json(project)
})

router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { name, description, color } = req.body
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (color !== undefined) { fields.push('color = ?'); values.push(color) }
  if (fields.length > 0) {
    fields.push('updated_at = ?')
    values.push(now)
    values.push(req.params.id)
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }
  const project = db
    .prepare('SELECT id, name, description, color, sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = ?')
    .get(req.params.id)
  res.json(project)
})

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router
