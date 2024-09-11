import fs from 'fs'
import path from 'path'
import { Request, Response, NextFunction } from 'express'
import formidable, { File } from 'formidable'
import { includes } from 'lodash'

export const initFolder = () => {
  if (!fs.existsSync(path.resolve('uploads'))) {
    fs.mkdirSync(path.resolve('uploads'), {
      recursive: true // mục đích tạo folder cha
    })
  }
}

export const handleUploadSingleImages = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads'), // backup image in folder uploads
    maxFiles: 1,
    maxFieldsSize: 300 * 1024, // 300KB
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
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // nếu không truyền j lên thì sẽ lỗi
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve((files.image as File[])[0])
    })
  })
}
