import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { config } from 'dotenv'
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweets.requests'
import tweetsService from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'

import { TweetType } from '~/constants/enums'
config()
export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({ message: 'Upload success', result })
}
export const getTweetController = async (req: Request, res: Response) => {
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_access_token?.user_id)

  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }

  return res.json({ message: 'get success', result: tweet })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)

  const user_id = req.decoded_access_token?.user_id

  const { tweets_children, total } = await tweetsService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })

  return res.json({
    message: 'get success',
    result: {
      tweets: tweets_children,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
export const getNewFeedController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const user_id = req.decoded_access_token?.user_id as string
  const result = await tweetsService.getNewFeeds({ user_id, limit, page })

  return res.json({
    message: 'get success',
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}
