import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { validate } from '~/utils/validation'

export const searchTweetValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: 'Content must be a string'
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: 'Media type must be either image or video'
        },
        errorMessage: `Media type must be one of ${Object.values(MediaTypeQuery).join(', ')} `
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)]
        },
        errorMessage: `people follow type must be one of ${Object.values(PeopleFollow).join(', ')} `
      }
    },
    ['query']
  )
)
