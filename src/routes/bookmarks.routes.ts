import { Router } from 'express'
import { bookmarksTweetController, unBookmarksTweetController } from '~/controllers/bookmarks.controllers'
import { createTweetController } from '~/controllers/tweets.controller'
import { createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidation, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()
/*
    Create BOOKMARK Tweet
     body: {tweet_id: string}
*/
bookmarksRouter.post(
  '/',
  accessTokenValidation,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarksTweetController)
)
/*
    Delete BOOKMARK Tweet
    path : /tweets/:tweet_id
     body: {tweet_id: string}
*/
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidation,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarksTweetController)
)
export default bookmarksRouter
