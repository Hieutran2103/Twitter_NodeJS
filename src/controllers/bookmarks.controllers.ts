import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { config } from 'dotenv'

import tweetsService from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { BookmarksTweetRequestBody } from '~/models/requests/Bookmarks.requests'
import bookmarksService from '~/services/bookmarks.services'
import { BOOKMARKS_MESSAGE } from '~/constants/messages'
config()

export const bookmarksTweetController = async (
  req: Request<ParamsDictionary, any, BookmarksTweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await bookmarksService.bookmarksTweet(user_id, req.body.tweet_id)
  return res.json({
    message: BOOKMARKS_MESSAGE.CREATE_BOOKMARKS_SUCCESS,
    result
  })
}

export const unBookmarksTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await bookmarksService.unBookmarksTweet(user_id, req.params.tweet_id)
  return res.json({
    message: BOOKMARKS_MESSAGE.DELETE_BOOKMARKS_SUCCESS,
    result
  })
}
