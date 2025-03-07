import { S3 } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import fs from 'fs'
import { Upload } from '@aws-sdk/lib-storage'
import path from 'path'
config()

// Ket noi voi s3
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

// s3.listBuckets({}).then((data) => console.log(data))

export const uploadFiletoS3 = ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: 'twitter-hieu', Key: filename, Body: fs.readFileSync(filepath), ContentType: contentType },
    // optional tags
    tags: [],
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false
  })
  return parallelUploads3.done()
}
