import { Router } from 'express'
import { uploadImageController, uploadVideoController, uploadVideoHLSController } from '~/controllers/medias.controller'
import { accessTokenValidation, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRouter = Router()

/*
    UPLOAD IMAGE
body{  image:file}
*/
mediasRouter.post(
  '/upload-image',
  accessTokenValidation,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)
mediasRouter.post(
  '/upload-video',
  accessTokenValidation,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)

mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidation,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoHLSController)
)

export default mediasRouter
