import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidation,
  loginValidator,
  refreshTokenValidation,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const usersRouter = Router()
/*
    LOGIN

 body{  email:string , password:string}
*/
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

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
export default usersRouter
