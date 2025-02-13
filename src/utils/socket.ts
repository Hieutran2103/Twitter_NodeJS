import { createServer } from 'http'
import { ObjectId } from 'mongodb'
import { Server } from 'socket.io'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { verifyAccessToken } from '~/middlewares/common.middlewares'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Conversation from '~/models/schemas/Conversations.schema'
import databaseService from '~/services/database.services'

// Server của http và socket bị trùng nhau nên phải đổi tên
import { Server as ServerHttp } from 'http'

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })

  //Middleware socket này chỉ chạy 1 lần
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    try {
      const decoded_access_token = await verifyAccessToken(access_token)
      const { verify } = decoded_access_token as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USER_MESSAGE.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      // console.log(decoded_access_token)
      // Lưu thông tin user_id vào socket rồi chuyển đến phần connect
      socket.handshake.auth.decoded_access_token = (decoded_access_token as TokenPayload).user_id

      // dùng để validata acccess_token mới
      socket.handshake.auth.access_token = access_token

      next()
    } catch (error) {
      // Phai next dung kieu du lieu
      next({
        message: 'Unauthorized access token',
        name: 'Unauthorized access token',
        data: error
      })
    }
  })

  // SocketIO: Gửi tin nhắn cho người dùng đang đăng nhập
  // Danh sách users lưu thông tin socket
  const users: {
    [key: string]: { socket_id: string }
  } = {}

  io.on('connection', (socket) => {
    const user_id = socket.handshake.auth.decoded_access_token

    // Đảm bảo user_id hợp lệ trước khi thêm vào danh sách
    if (user_id) {
      users[user_id] = { socket_id: socket.id }
    }

    console.log('Users after connection:', users)

    //===================== middlewares =============================

    // Socket middlewares check xem access token còn hạn thì next, hết hạn thì disconnected
    socket.use(async (packet, next) => {
      const access_token = socket.handshake.auth.access_token
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized access token'))
      }
    })
    // Hứng lỗi
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized access token') {
        socket.disconnect()
      }
    })

    //==============================================================

    // Xử lý gửi tin nhắn riêng tư từ data bên FE trả về đây
    socket.on('send_message', async (data) => {
      const { sender_id, receiver_id, content } = data.payload
      const receiver_socket_id = users[receiver_id]?.socket_id

      if (receiver_socket_id) {
        const conversation = new Conversation({
          // chú ý đến kiểu ObjectId
          sender_id: new ObjectId(String(sender_id)),
          receiver_id: new ObjectId(String(receiver_id)),
          content
        })
        // Thêm tin nhắn vào cơ sở dữ liệu để lưu trữ và trả về cho người nhận
        const result = await databaseService.conversations.insertOne(conversation)

        conversation._id = result.insertedId

        // Gửi tin nhắn đến người nhận
        socket.to(receiver_socket_id).emit('receive_message', {
          payload: conversation
        })
      }
    })

    // Xử lý khi user disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`)

      // Đảm bảo user_id tồn tại và không bị ghi đè bởi phiên khác trước khi xóa
      if (user_id && users[user_id]?.socket_id === socket.id) {
        delete users[user_id]
        console.log(`User ${user_id} removed from users`)
      }

      console.log('Users after disconnection:', users)
    })
  })
}

export default initSocket
