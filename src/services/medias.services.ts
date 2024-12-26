import { Request, Response, NextFunction } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_FOLDER } from '~/constants/dir'
import { getNameFormFullName, handleUploadImages, handleUploadVideo } from '~/utils/file'
import fs from 'fs/promises'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Others'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'

config()
class MediasService {
  async handleUploadImages(req: Request) {
    const files = await handleUploadImages(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFormFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_FOLDER, `${newName}.jpg`)
        // console.log(file)
        // console.log(newPath)
        // sharp sẽ lấy url để xử lý rồi add vào uploadFolder
        await sharp(file.filepath).jpeg({}).toFile(newPath),
          // mục đích để xóa ảnh ở folder Temp
          await Promise.all([fs.unlink(file.filepath), fs.unlink(newPath)])

        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideo(req)

    const result: Media[] = files.map((file) => {
      const { newFilename } = file
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${newFilename}`,
        type: MediaType.Video
      }
    })
    return result
  }

  async handleUploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename, filepath } = file
        console.log(filepath)
        await encodeHLSWithMultipleVideoStreams(filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video/${newFilename}`
            : `http://localhost:${process.env.PORT}/static/video/${newFilename}`,
          type: MediaType.Video
        }
      })
    )
    return result
  }
}
const mediasService = new MediasService()
export default mediasService
