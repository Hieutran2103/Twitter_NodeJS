import { Request, Response, NextFunction } from 'express'
import express from 'express'

import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()
const port = 3000
app.use(express.json())
databaseService.connect()

// Routes
app.use('/users', usersRouter)
app.use(defaultErrorHandler)

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
