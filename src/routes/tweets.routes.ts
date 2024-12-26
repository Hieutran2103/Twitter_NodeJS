import { Router } from 'express'
import { createTweetController, getTweetChildrenController, getTweetController } from '~/controllers/tweets.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidation, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/*
    Get Tweet Detail
    path : /tweets/:tweet_id
*/
tweetsRouter.get(
  '/:tweet_id',
  isUserLoggedInValidator(accessTokenValidation),
  isUserLoggedInValidator(verifiedUserValidator),
  tweetIdValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
)
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

/*
    Get Tweet Children (Retweet,Comment,QuoteTweet)
    path : /tweets/:tweet_id/children
    method : get
    Query :{ limit:number , page:number ,tweet_type : TweetType}
*/
tweetsRouter.get(
  '/:tweet_id/children',
  isUserLoggedInValidator(accessTokenValidation),
  isUserLoggedInValidator(verifiedUserValidator),
  tweetIdValidator,
  getTweetChildrenValidator,
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetsRouter
