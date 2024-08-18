//https://github.com/validatorjs/validator.js?tab=readme-ov-file

import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USER_MESSAGE.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGE.NAME_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 1,
          max: 50
        },
        errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      trim: true // sanitize
    },
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const emailExist = await usersService.checkEmailExists(value)
          if (emailExist) {
            throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    _password: {
      notEmpty: {
        errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    },
    get password() {
      return this._password
    },
    set password(value) {
      this._password = value
    },
    confirm_password: {
      notEmpty: {
        errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    },
    date_of_birth: {
      notEmpty: {
        errorMessage: USER_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
      },
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
