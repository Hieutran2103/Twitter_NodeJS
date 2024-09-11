import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'
import { handleUploadSingleImages } from '~/utils/file'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadSingleImages(req)
  console.log(data)
  return res.json({ message: 'Upload success', result: data })
}
