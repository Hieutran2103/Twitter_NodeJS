import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validation'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)

/*
    REGISTER
 gửi ngày giờ lên server ta dùng Date().toISOString()
 body{ name:string , email:string , password:string,confirm_password:String, date_of_birth: ISOString}
*/
usersRouter.post('/register', validate(registerValidator), registerController)

export default usersRouter
