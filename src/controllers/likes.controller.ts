import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { config } from 'dotenv'

import { TokenPayload } from '~/models/requests/User.requests'

import { BookmarksTweetRequestBody } from '~/models/requests/Bookmarks.requests'
import bookmarksService from '~/services/bookmarks.services'
import { LIKES_MESSAGE } from '~/constants/messages'
import likesService from '~/services/likes.services'
config()

export const likesTweetController = async (
  req: Request<ParamsDictionary, any, BookmarksTweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await likesService.likesTweet(user_id, req.body.tweet_id)
  return res.json({
    message: LIKES_MESSAGE.LIKE_SUCCESS,
    result
  })
}

export const unLikesTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await likesService.unLikesTweet(user_id, req.params.tweet_id)
  return res.json({
    message: LIKES_MESSAGE.DELETE_LIKES_SUCCESS,
    result
  })
}
