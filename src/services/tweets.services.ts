import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schemas'
import { after } from 'lodash'
import { TweetType } from '~/constants/enums'

class TweetsService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtags trong db nếu có thì lấy , ko thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    //WithId<Hashtag> để chắc chắn ko null
    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }
  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)

    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtags,
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )

    return tweet as WithId<Tweet>
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id?: string
  }) {
    const tweets_children = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    // Tăng view cho list children
    const ids = tweets_children.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    // tính tổng số item
    const [, total] = await Promise.all([
      await databaseService.tweets.updateMany(
        { _id: { $in: ids } }, // tìm những id nào có trong tweet
        {
          $inc: inc,
          $set: {
            updated_at: new Date()
          }
        }
      ),
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])

    // Để trả về gtri user_view or guest_view mới luôn vì updateMany không có returnDocument: 'after'
    tweets_children.forEach((tweet) => {
      tweet.updated_at = new Date()
      if (user_id) {
        ;(tweet.user_views as number) += 1
      } else {
        ;(tweet.guest_views as number) += 1
      }
    })

    return { tweets_children, total }
  }
  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id)

    const followed_user_ids = await databaseService.followers
      .find(
        { user_id: new ObjectId(user_id) },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()

    const ids = followed_user_ids.map((item) => item.followed_user_id)
    // để thêm cả new feed của user hiện tại
    ids.push(user_id_obj)

    // Lấy được các tweets và  Lấy total của newfeed => gộp chung 2 thk aggregate phức tạp này sẽ tối ưu đc nh
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              },
              type: 0
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: { path: '$user' } },
          {
            $match: {
              $or: [
                { audience: 0 },
                {
                  $and: [
                    { audience: 1 },
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              bookmarks: { $size: '$bookmarks' },
              likes: { $size: '$likes' },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: { $eq: ['$$item.type', TweetType.Retweet] }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: { $eq: ['$$item.type', TweetType.Comment] }
                  }
                }
              },
              quote_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                  }
                }
              },
              views: {
                $add: ['$user_views', '$guest_views']
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      await databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              },
              type: 0
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: { path: '$user' } },
          {
            $match: {
              $or: [
                { audience: 0 },
                {
                  $and: [
                    { audience: 1 },
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'tweets_count'
          }
        ])
        .toArray()
    ])

    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)

    // up view
    await databaseService.tweets.updateMany(
      { _id: { $in: tweet_ids } }, // tìm những id nào có trong tweet
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: new Date()
        }
      }
    )

    // Để trả về gtri user_view or guest_view mới luôn vì updateMany không có returnDocument: 'after'
    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      ;(tweet.user_views as number) += 1
    })

    return { tweets, total: total[0].tweets_count }
  }
}
const tweetsService = new TweetsService()
export default tweetsService
