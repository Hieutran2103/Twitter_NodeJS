import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_FOLDER, UPLOAD_VIDEO_FOLDER } from '~/constants/dir'
import { HTTP_STATUS } from '~/constants/httpStatus'
import fs from 'fs'
import mime from 'mime'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadImage(req)

  return res.json({ message: 'Upload success', result })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.UploadVideo(req)
  return res.json({ message: 'Upload success', result })
}
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.handleUploadVideoHLS(req)
  return res.json({ message: 'Upload success', result })
}

// get Image from server
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const name = req.params.name
  return res.sendFile(path.resolve(UPLOAD_IMAGE_FOLDER, name), (err) => {
    if (err) {
      console.log(path.resolve(UPLOAD_IMAGE_FOLDER, name))

      return res.status((err as any).status).send('Error uploading image')
    }
  })
}
export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Invalid Range')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_FOLDER, name)

  // dung luong VIdeo
  const videoSize = fs.statSync(videoPath).size
  // dung luong VIdeo cho mỗi phân đoạn stream
  const chunkSize = 10 ** 6 // 1MB
  // lấy gtri byte bđầu từ header Range
  const start = Number(range.replace(/\D/g, ''))
  // Lấy gtri byte kết thúc, vượt quá dung lượng video thì lấy gtri videoSize
  const end = Math.min(start + chunkSize, videoSize - 1)

  // Dụng lượng thực tế cho mỗi đoạn video stream
  // Thường đây sẽ là chunkSize , ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Range': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const stream = fs.createReadStream(videoPath, { start, end })
  stream.pipe(res)
}
