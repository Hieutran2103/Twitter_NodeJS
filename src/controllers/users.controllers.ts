import { Request, Response, NextFunction } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  ChangePasswordReqBody,
  FolowReqBody,
  ForgotPasswordReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnFolowReqParams,
  UpdateMeReqBody,
  VerifyForgotPasswordReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import { USER_MESSAGE } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
config()
export const loginController = async (req: Request, res: Response) => {
  //Test error
  // throw new Error("Invalid")
  const user = req.user as User
  const user_id = user._id as ObjectId

  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({ message: USER_MESSAGE.LOGIN_SUCCESS, result })
}
export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&newUser=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({ message: USER_MESSAGE.REGISTER_SUCCESS, result })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json({ message: USER_MESSAGE.LOGOUT_SUCCESS })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })
  return res.json({ message: USER_MESSAGE.REFRESH_TOKEN_SUCCESSFUL, result })
}

export const emailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }

  // nếu user đã verify trước rồi thì trả về OK
  if (user.email_verify_token == '') {
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersService.verifyEmail(user_id)

  return res.json({ message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_SUCCESS, result })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  if (user.verify == UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersService.sendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({ user_id: _id.toString(), verify: verify })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  return res.json({
    message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body

  const result = await usersService.resetPassword(user_id, password)
  return res.json(result)
}
export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const result = await usersService.getMe(user_id)
  return res.json({
    message: USER_MESSAGE.GET_Me_SUCCESS,
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const { body } = req
  const result = await usersService.updateMe(user_id, body)
  return res.json({
    message: USER_MESSAGE.UPDATE_ME_SUCCESS,
    result
  })
}

export const followController = async (req: Request<ParamsDictionary, any, FolowReqBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload

  const { followed_user_id } = req.body
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowController = async (req: Request<UnFolowReqParams>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayload

  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollow(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_access_token as TokenPayload
  const { password } = req.body

  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}
