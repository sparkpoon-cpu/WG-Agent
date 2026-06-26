import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'wg-agent-secret-change-in-production'
const TOKEN_EXPIRY = '30d'

export interface AuthUser {
  id: string
  username: string
  isAdmin: boolean
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

// Auth middleware
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = header.slice(7)
  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Admin middleware
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}

// Initialize admin user on first run
export function initAdminUser(): void {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE is_admin = 1').get()
  if (existing) return

  // Read admin password from env or use default
  const password = process.env.ADMIN_PASSWORD || 'wgadmin123'
  const hash = bcrypt.hashSync(password, 10)
  const { v4: uuid } = require('uuid')

  db.prepare('INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, 1)').run(
    uuid(),
    'admin',
    hash
  )

  console.log(`Admin user created: admin / ${password}`)
}

// Login handler
export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: AuthUser } | null> {
  const db = getDb()
  const user = db
    .prepare('SELECT id, username, password_hash, is_admin FROM users WHERE username = ?')
    .get(username) as
    | { id: string; username: string; password_hash: string; is_admin: number }
    | undefined

  if (!user) return null

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) return null

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    isAdmin: !!user.is_admin
  }
  const token = generateToken(authUser)
  return { token, user: authUser }
}
