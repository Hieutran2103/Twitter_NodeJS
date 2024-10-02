import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controller'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidation, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()
/*
    Create Tweets
     body: TweetRequestBody
*/
tweetsRouter.post(
  '/',
  accessTokenValidation,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

export default tweetsRouter
