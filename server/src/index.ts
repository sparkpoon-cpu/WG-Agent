import express from 'express'
import cors from 'cors'
import path from 'path'
import { initAdminUser } from './auth'
import authRoutes from './routes/auth'
import conversationRoutes from './routes/conversations'
import messageRoutes from './routes/messages'
import scriptRoutes from './routes/scripts'
import projectRoutes from './routes/projects'
import settingsRoutes from './routes/settings'
import chatRoutes from './routes/chat'

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/scripts', scriptRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/chat', chatRoutes)

// Serve frontend static files in production
const clientDist = process.env.CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

// Initialize
initAdminUser()

app.listen(PORT, () => {
  console.log(`WG Agent Server running on http://localhost:${PORT}`)
  console.log(`API: http://localhost:${PORT}/api`)
  console.log(`Admin: admin / ${process.env.ADMIN_PASSWORD || 'wgadmin123'}`)
})
