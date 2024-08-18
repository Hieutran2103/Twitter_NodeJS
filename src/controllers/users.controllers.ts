import { Request, Response, NextFunction } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email == 'hieu' && password == 123) {
    return res.status(200).json({ message: 'Login success' })
  }

  return res.status(400).json({ message: 'Login failed' })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({ message: 'register successfully', result })
}
