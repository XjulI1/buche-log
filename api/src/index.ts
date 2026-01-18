import 'dotenv/config'
import app from './app.js'
import { initializeDatabase } from './config/database.js'

const PORT = process.env.API_PORT || 3000

async function start() {
  try {
    await initializeDatabase()
    console.log('Database connected')

    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
