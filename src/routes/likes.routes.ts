import { Router } from 'express'
import { likesTweetController, unLikesTweetController } from '~/controllers/likes.controller'
import { createTweetController } from '~/controllers/tweets.controller'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidation, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()
/*
    Like Tweet
     body: {tweet_id: string}
*/
likesRouter.post('/', accessTokenValidation, verifiedUserValidator, wrapRequestHandler(likesTweetController))
/*
    Delete Like Tweet
    path : /tweets/:tweet_id
*/
likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidation,
  verifiedUserValidator,
  wrapRequestHandler(unLikesTweetController)
)

export default likesRouter
