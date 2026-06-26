import { Router, Request, Response } from 'express'
import { login, authMiddleware } from '../auth'
import { getDb } from '../db'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const router = Router()

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' })
    return
  }

  const result = await login(username, password)
  if (!result) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  res.json(result)
})

// Get current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json(req.user)
})

// Create user (admin only)
router.post(
  '/users',
  authMiddleware,
  (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin only' })
      return
    }
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' })
      return
    }
    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ error: 'Username already exists' })
      return
    }
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
      uuid(),
      username,
      hash
    )
    res.status(201).json({ username })
  }
)

// List users (admin only)
router.get('/users', authMiddleware, (req: Request, res: Response) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin only' })
    return
  }
  const db = getDb()
  const users = db
    .prepare('SELECT id, username, is_admin as isAdmin, created_at as createdAt FROM users ORDER BY created_at')
    .all()
  res.json(users)
})

export default router
