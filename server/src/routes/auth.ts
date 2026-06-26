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

// Change password (any authenticated user)
router.post('/change-password', authMiddleware, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: '当前密码和新密码不能为空' })
    return
  }
  if (newPassword.length < 3) {
    res.status(400).json({ error: '新密码至少 3 位' })
    return
  }

  const db = getDb()
  const user = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(req.user!.id) as { password_hash: string } | undefined

  if (!user) {
    res.status(404).json({ error: '用户不存在' })
    return
  }

  const valid = bcrypt.compareSync(currentPassword, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: '当前密码错误' })
    return
  }

  const newHash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user!.id)
  res.json({ success: true, message: '密码修改成功' })
})

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
