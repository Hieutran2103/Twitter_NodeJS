import User from '~/models/schemas/User.schemas'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hassPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { USER_MESSAGE } from '~/constants/messages'
import Follower from '~/models/schemas/Follower.schemas'
import axios from 'axios'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { random } from 'lodash'
config()
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,

        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,

      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    // Dùng để gáp exp của RefreshToken cũ vào RefreshToken mới, DÙng cho RefreshToken
    if (exp) {
      return signToken({
        payload: {
          user_id,
          verify,
          token_type: TokenType.RefreshToken,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }

    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string,
      options: {
        expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgetPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  // signAccessToken va signRefreshToken deu la bat dong bo nen dung Promise.all de toi uu performance
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      scretOnPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hassPassword(payload.password)
      })
    )
    // id cua user
    // signAccessToken va signRefreshToken deu la bat dong bo nen dung Promise.all de toi uu performance
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    }) //

    const { exp, iat } = await this.decodeRefreshToken(refreshToken)

    await databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refreshToken, iat, exp })
    )

    return { accessToken, refreshToken }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_accessToken, new_refreshToken] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshToken.deleteOne({ token: refresh_token })
    ])

    const decodedRefreshToken = await this.decodeRefreshToken(new_refreshToken)
    await databaseService.refreshToken.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refreshToken,
        iat: decodedRefreshToken.iat,
        exp: decodedRefreshToken.exp
      })
    )

    return { accessToken: new_accessToken, refreshToken: new_refreshToken }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify
    })
    const { exp, iat } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refreshToken, iat, exp })
    )
    return { accessToken, refreshToken }
  }

  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token, alt: 'json' },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      given_name: string
      family_name: string
      picture: string
      verified_email: boolean
      name: string
    }
  }
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.GOOGLE_EMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // kiem tra email da dc dki hay chua
    const user = await databaseService.users.findOne({ email: userInfo.email })

    if (user) {
      const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const { exp, iat } = await this.decodeRefreshToken(refreshToken)

      await databaseService.refreshToken.insertOne(
        new RefreshToken({ user_id: new ObjectId(user._id), token: refreshToken, iat, exp })
      )
      return {
        accessToken,
        refreshToken,
        newUser: 0, // người cũ
        verify: user.verify
      }
    } else {
      // radom string password
      const password = Math.random().toString(36).substring(2, 15)

      // không có thì đki mới luôn
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified }
    }
  }
  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async logout(refresh_token: string) {
    await databaseService.refreshToken.deleteOne({ token: refresh_token })
    return {
      message: USER_MESSAGE.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Verified
      }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { email_verify_token: '', updated_at: new Date(), verify: UserVerifyStatus.Verified } }
      )
    ])

    const [accessToken, refreshToken] = token
    const { exp, iat } = await this.decodeRefreshToken(refreshToken)

    await databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refreshToken, iat, exp })
    )
    return {
      accessToken,
      refreshToken
    }
  }

  async sendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // gui lại email
    console.log(email_verify_token)

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token, updated_at: new Date() } }
    )
    return {
      message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id: user_id.toString(),
      verify
    })

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { forgot_password_token, updated_at: new Date() } }
    )

    // Gửi email kèm đường link
    console.log('forgotPassword: ', forgot_password_token)
    return {
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { forgot_password_token: '', password: hassPassword(password), updated_at: new Date() } }
    )

    return {
      message: USER_MESSAGE.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: { ...(_payload as UpdateMeReqBody & { date_of_birth?: Date }) },
        $currentDate: { updated_at: true }
      },
      {
        // để trả ra gtri vừa update nếu k có thì nó sẽ trả về gtri cũ
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const isFollowing = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (isFollowing) {
      return { message: USER_MESSAGE.ALREADY_FOLLOWED }
    }

    await databaseService.followers.insertOne(
      new Follower({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
    )
    return { message: USER_MESSAGE.FOLLOW_SUCCESS }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    const isFollowing = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (isFollowing) {
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
      return { message: USER_MESSAGE.UNFOLLOW_SUCCESS }
    }

    return { message: USER_MESSAGE.ALREADY_UNFOLLOW_SUCCESS }
  }
  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: hassPassword(new_password), updated_at: new Date() } }
    )
    return { message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESSFULLY }
  }
}

const usersService = new UsersService()
export default usersService
