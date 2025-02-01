import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { searchTweetValidator } from '~/middlewares/search.middlewares'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidation, verifiedUserValidator } from '~/middlewares/users.middlewares'

const searchRouter = Router()

searchRouter.get(
  '/',
  accessTokenValidation,
  verifiedUserValidator,
  searchTweetValidator,
  paginationValidator,
  searchController
)

export default searchRouter
