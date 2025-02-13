import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { config } from 'dotenv'

import { TokenPayload } from '~/models/requests/User.requests'
import conversationService from '~/services/conversations.services'
import { GetConversationParam } from '~/models/requests/Conversations.requests'

config()

export const getConversationsController = async (req: Request<GetConversationParam>, res: Response) => {
  // const { user_id } = req.decoded_access_token as TokenPayload
  const sender_id = req.decoded_access_token?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const receiver_id = req.params.receiverId

  const result = await conversationService.getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  })

  return res.json({
    result: {
      limit,
      page,
      total_page: Math.ceil(result.total / limit),
      conversations: result.conversations
    },
    message: 'Get conversations success'
  })
}
