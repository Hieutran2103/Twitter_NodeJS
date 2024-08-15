import User from '~/models/schemas/User.schemas'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hassPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: '15m',
        algorithm: 'HS256'
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: '100d',
        algorithm: 'HS256'
      }
    })
  }

  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({ ...payload, date_of_birth: new Date(payload.date_of_birth), password: hassPassword(payload.password) })
    )
    // id cua user
    const user_id = result.insertedId.toString()
    // signAccessToken va signRefreshToken deu la bat dong bo nen dung Promise.all de toi uu performance
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])

    return { accessToken, refreshToken }
  }

  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}

const usersService = new UsersService()
export default usersService
