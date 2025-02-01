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
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
// import '~/utils/fake'

config()
const app = express()
app.use(cors())
const httpServer = createServer(app)

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
app.use('/search', searchRouter)

//Error Handler
app.use(defaultErrorHandler)

const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

io.on('connect', (socket) => {
  console.log(`${socket.id} connected`) // x8WIv7-mJelg7on_ALbx

  socket.on('hello', (agr) => {
    console.log(agr)
  })
  socket.emit('hehe', {
    name: 'hello',
    age: 34
  })
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`) // x8WIv7-mJelg7on_ALbx
  })
})

// Start the server
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
