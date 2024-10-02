import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  oauthController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleWare } from '~/middlewares/common.middlewares'
import {
  accessTokenValidation,
  changePasswordValidator,
  emailVerifyTokenValidation,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidation,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()
/*
    LOGIN

 body{  email:string , password:string}
*/
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/*
    OAuth with Google Account
    method: Get
    query : {code:string}
*/
usersRouter.get('/oauth/google', wrapRequestHandler(oauthController))

/*
    REGISTER
 gửi ngày giờ lên server ta dùng Date().toISOString()
 body{ name:string , email:string , password:string,confirm_password:String, date_of_birth: ISOString}
*/

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/*
    Logout
    Header: {Authorization: Bearer <access_token>}
    Body: {refresh_token: string}
*/
usersRouter.post('/logout', accessTokenValidation, refreshTokenValidation, wrapRequestHandler(logoutController))

/*
    Refresh Token
    Body: {refresh_token: string}
*/
usersRouter.post('/refresh-token', refreshTokenValidation, wrapRequestHandler(refreshTokenController))

/*
    VerifyEmail
    Body: {email_verify_token: string}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidation, wrapRequestHandler(emailVerifyController))

/*
    ResendVerifyEmail
    Header: {Authorization: Bearer <access_token>}
    Body: {}
*/
usersRouter.post('/resend-verify-email', accessTokenValidation, wrapRequestHandler(resendVerifyEmailController))

/*
    ForgotPassword
    Body: {email: string}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/*
    VerifyForgotPassword
    Body: {forgot_password_token: string}
*/
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/*
    Reset Password
    Body: {forgot_password_token: string}
*/
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/*
    Get my Profile
    Header: {Authorization: Bearer <access_token>}

*/
usersRouter.get('/get-me', accessTokenValidation, wrapRequestHandler(getMeController))

/*
    UPDATE MY Profile 
    Header: {Authorization: Bearer <access_token>}
    Body: User schema 
*/
usersRouter.patch(
  '/update-me',
  accessTokenValidation,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleWare<UpdateMeReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
)

/*
    FOLLOW USER
    Header: {Authorization: Bearer <access_token>}
    Body: {followed_user_id: string}
*/
usersRouter.post(
  '/follow',
  accessTokenValidation,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/*
    UNFOLLOW USER
    Header: {Authorization: Bearer <access_token>}
    Params: {user_id: string}
*/
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidation,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/*
    Change Password
    method: PUT
    Header: {Authorization: Bearer <access_token>}
    Body: {old_password: string, password:string, confirm_password:string}
*/
usersRouter.put(
  '/change-password',
  accessTokenValidation,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default usersRouter
