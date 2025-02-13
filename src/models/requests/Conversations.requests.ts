import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface GetConversationParam extends ParamsDictionary {
  receiverId: string
}
