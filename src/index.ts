import { Request, Response, NextFunction } from 'express'
import express from 'express'

import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
const app = express()
const port = 3000
app.use(express.json())

// Routes
app.use('/users', usersRouter)
databaseService.connect()
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: err.message })
})

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
