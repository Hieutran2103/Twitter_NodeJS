import { Request, Response, NextFunction } from 'express'
import express from 'express'

import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'
config()
const app = express()
const port = process.env.PORT || 4000
app.use(express.json())
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})

// Tạo folder Upload
initFolder()
// Routes
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
//Error Handler
app.use(defaultErrorHandler)

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
