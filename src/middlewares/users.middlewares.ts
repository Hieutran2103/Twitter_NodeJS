//https://github.com/validatorjs/validator.js?tab=readme-ov-file

import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import usersService from '~/services/users.services'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' })
  }
  next()
}

export const registerValidator = checkSchema({
  name: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: {
        min: 1,
        max: 50
      }
    },
    trim: true // sanitize
  },
  email: {
    notEmpty: true,
    isEmail: true,
    trim: true,
    custom: {
      options: async (value) => {
        const email = await usersService.checkEmailExists(value)
        if (email) {
          throw new Error('Email already exists')
        }
        return email
      }
    }
  },
  password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: {
        min: 6,
        max: 50
      }
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    }
  },
  confirm_password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: {
        min: 6,
        max: 50
      }
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords must match.')
        }
        return true
      }
    }
  },
  date_of_birth: {
    notEmpty: true,
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      }
    }
  }
})
