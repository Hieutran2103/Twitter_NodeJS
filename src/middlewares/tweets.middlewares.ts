import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/messages'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType) // isIn sẽ check những gì ở trong mảng có không , và để nhớ các type trong TweetType của mình nên tạo numberEnumToArray
const TweetAudiences = numberEnumToArray(TweetAudience) // tương tự
const TweetMediaType = numberEnumToArray(MediaType) // tương tự

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGE.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [TweetAudiences],
          errorMessage: TWEET_MESSAGE.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type as TweetType
            //Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }
            //nếu `type` là tweet thì `parent_id` phải là `null`
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]
            //Nếu `type` là retweet thì `content` phải là `''`
            if (type === TweetType.Retweet && !isEmpty(value)) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_EMPTY_STRING)
            }
            //Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              isEmpty(value)
            ) {
              throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: async (value, { req }) => {
            //yêu cầu mỗi ptu trong array là string
            if (!value.every((item: any) => typeof item === 'string')) {
              throw new Error(TWEET_MESSAGE.HASHTAG_MUST_BE_AN_ARRAY_STRING)
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: async (value, { req }) => {
            //yêu cầu mỗi ptu trong array là object id
            if (!value.every((item: any) => ObjectId.isValid(item))) {
              throw new Error(TWEET_MESSAGE.MENTION_MUST_BE_AN_ARRAY_OF_USER_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: async (value, { req }) => {
            //yêu cầu mỗi ptu trong array là media object
            if (!value.every((item: any) => typeof item.url === 'string' && TweetMediaType.includes(item.type))) {
              throw new Error(TWEET_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
