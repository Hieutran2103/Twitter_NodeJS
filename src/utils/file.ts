import fs from 'fs'

import { Request, Response, NextFunction } from 'express'
import formidable, { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_FOLDER, UPLOAD_VIDEO_FOLDER, UPLOAD_VIDEO_TEMP_FOLDER } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_FOLDER, UPLOAD_VIDEO_TEMP_FOLDER].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // mục đích tạo folder cha,
      })
    }
  })
}

export const handleUploadImages = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_FOLDER, // backup image in folder uploads
    maxFiles: 4,
    maxFieldsSize: 300 * 1024, // 300KB ( kich thuoc cua 1 image)
    maxTotalFileSize: 300 * 1024 * 4, // ( kich thuoc cua 4 image)
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      // console.log(name) // tên key
      // console.log(originalFilename)
      // console.log(mimetype) // kiểu

      const valid = name === 'image' && Boolean(mimetype?.includes('image'))
      if (!valid) {
        form.emit('error' as any, new Error('File types is not allowed') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // nếu không truyền j lên thì sẽ lỗi
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_FOLDER, // backup image in folder uploads
    maxFiles: 1,
    maxFieldsSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File types is not allowed') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // nếu không truyền j lên thì sẽ lỗi
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }

      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })

      resolve(files.video as File[])
    })
  })
}

export const getNameFormFullName = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}
export const getExtension = (fullname: string) => {
  const namearr = fullname.split('.')
  return namearr[namearr.length - 1]
}