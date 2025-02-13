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
import cors, { CorsOptions } from 'cors'
import conversationsRouter from './routes/conversations.routes'

import helmet from 'helmet'
import initSocket from './utils/socket'
import { rateLimit } from 'express-rate-limit'
import { isProduction } from './constants/config'
// import '~/utils/fake'

config()
const app = express()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)

// const corsOptions: CorsOptions = {
//   origin: isProduction ? envConfig.clientUrl : '*'
// }

app.use(cors())
app.use(helmet())

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
app.use('/conversations', conversationsRouter)

initSocket(httpServer)
//Error Handler
app.use(defaultErrorHandler)

// Khởi động server
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
