import { createHash } from 'node:crypto'

export function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

// Tang cuong tinh bao mat
export function hassPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
