import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEET_MESSAGE, USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
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
export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({ message: TWEET_MESSAGE.INVALID_ID_TWEET_ID, status: HTTP_STATUS.BAD_REQUEST })
            }
            //kiểm tra tweet_id xem đã tồn tại trong db chưa
            const tweet = (
              await databaseService.tweets
                .aggregate<Tweet>([
                  {
                    $match: {
                      _id: new ObjectId(value)
                    }
                  },
                  {
                    $lookup: {
                      from: 'hashtags',
                      localField: 'hashtags',
                      foreignField: '_id',
                      as: 'hashtags'
                    }
                  },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'mentions',
                      foreignField: '_id',
                      as: 'mentions'
                    }
                  },
                  {
                    $addFields: {
                      mentions: {
                        $map: {
                          input: '$mentions',
                          as: 'mention',
                          in: {
                            _id: '$$mention._id',
                            name: '$$mention.name'
                          }
                        }
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'bookmarks',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'bookmarks'
                    }
                  },
                  {
                    $lookup: {
                      from: 'likes',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'likes'
                    }
                  },
                  {
                    $lookup: {
                      from: 'tweets',
                      localField: '_id',
                      foreignField: 'parent_id',
                      as: 'tweet_children'
                    }
                  },
                  {
                    $addFields: {
                      bookmarks: {
                        $size: '$bookmarks'
                      },
                      likes: {
                        $size: '$likes'
                      },
                      retweet_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.Retweet]
                            }
                          }
                        }
                      },
                      comment_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.Comment]
                            }
                          }
                        }
                      },
                      quote_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.QuoteTweet]
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    $project: {
                      tweet_children: 0
                    }
                  }
                ])
                .toArray()
            )[0]

            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGE.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

// Muốn xử dụng async await cho handler express thì phải có try catch
// hoặc dùng wrapRequestHandler

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience == TweetAudience.TwitterCircle) {
    // kiểm tra người xem tweet này đã đăng nhập hay chưa
    if (!req.decoded_access_token) {
      throw new ErrorWithStatus({ message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED, status: HTTP_STATUS.UNAUTHORIZED })
    }

    // Kiểm tra tài khoản của tác giả bài tweet có ổn không ()
    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id)
    })
    if (!author || author.verify == UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({ message: USER_MESSAGE.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
    }
    // Kiểm tra  người xem tweet có trong circle của tác giả hay không
    const { user_id } = req.decoded_access_token
    const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
    if (!isInTwitterCircle && !author._id.equals(user_id)) {
      throw new ErrorWithStatus({ message: TWEET_MESSAGE.TWEET_IS_NOT_PUBLIC, status: HTTP_STATUS.FORBIDDEN })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGE.INVALID_TWEET_TYPE
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: (value) => {
            if (Number(value) < 1 || Number(value) > 100) {
              throw new Error(TWEET_MESSAGE.LIMIT_MUST_BE_NUMBER_IN_RANGE)
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true
      }
    },
    ['query']
  )
)
