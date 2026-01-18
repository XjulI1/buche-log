import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
)

// Body parsing
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use(errorHandler)

export default app
