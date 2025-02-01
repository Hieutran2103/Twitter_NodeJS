import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SearchQuery } from '~/models/requests/Search.requests'

import searchService from '~/services/search.services'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)

  const { tweets, total } = await searchService.search({
    limit,
    page,
    content: req.query.content,
    user_id: req.decoded_access_token?.user_id as string,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow
  })

  res.json({
    message: 'get success',
    result: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
