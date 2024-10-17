import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { config } from 'dotenv'
import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import tweetsService from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
config()
export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({ message: 'Upload success', result })
}
