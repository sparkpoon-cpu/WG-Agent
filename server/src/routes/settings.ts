import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../auth'
import { getDb } from '../db'

const router = Router()
router.use(authMiddleware)

// Get setting (any user can read)
router.get('/:key', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key) as
    | { value: string }
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Setting not found' })
    return
  }
  try {
    res.json({ key: req.params.key, value: JSON.parse(row.value) })
  } catch {
    res.json({ key: req.params.key, value: row.value })
  }
})

// Get all settings
router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string
    value: string
  }>
  const result: Record<string, unknown> = {}
  for (const row of rows) {
    // Don't expose API key to non-admins
    if (row.key === 'api_key' && !_req.user?.isAdmin) continue
    // Don't expose password hash
    if (row.key === 'admin_password_hash') continue
    try {
      result[row.key] = JSON.parse(row.value)
    } catch {
      result[row.key] = row.value
    }
  }
  res.json(result)
})

// Update setting (admin only for sensitive settings)
router.put('/:key', adminMiddleware, (req: Request, res: Response) => {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?'
  ).run(req.params.key, JSON.stringify(req.body.value), now, JSON.stringify(req.body.value), now)
  res.json({ key: req.params.key, value: req.body.value })
})

export default router
