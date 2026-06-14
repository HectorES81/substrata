export type CookieToSet = {
  name: string
  value: string
  options?: {
    domain?: string
    expires?: Date
    httpOnly?: boolean
    maxAge?: number
    path?: string
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none' | boolean
  }
}
