import { Router } from 'express'
import { bookmarksTweetController, unBookmarksTweetController } from '~/controllers/bookmarks.controllers'
import { getConversationsController } from '~/controllers/conversations.controllers'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import {
  accessTokenValidation,
  getConversationsValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiverId',
  accessTokenValidation,
  verifiedUserValidator,
  getConversationsValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationsRouter
