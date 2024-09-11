import { Request, Response, NextFunction } from 'express'
import express from 'express'

import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
const app = express()
const port = 3000
app.use(express.json())
databaseService.connect()

// Tạo folder Upload
initFolder()
// Routes
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)

app.use(defaultErrorHandler)

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
