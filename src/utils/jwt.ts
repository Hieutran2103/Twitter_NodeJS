import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from 'dotenv'
import { TokenPayload } from '~/models/requests/User.requests'
config()
export const signToken = ({
  payload,
  privateKey,
  options
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) => {
  if (options) {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(payload, privateKey, options, (error, token) => {
        if (error) {
          throw reject(error)
        }
        resolve(token as string)
      })
    })
  }
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, scretOnPublicKey }: { token: string; scretOnPublicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, scretOnPublicKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
