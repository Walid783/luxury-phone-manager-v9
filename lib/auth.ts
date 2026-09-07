import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me')
const COOKIE = 'lpm_session'
export type SessionUser = { id:string; name:string; email:string; role:'ADMIN'|'TECHNICIAN' }

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret)
  const jar = await cookies()
  jar.set(COOKIE, token, { httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', path:'/', maxAge:60*60*24*7 })
}
export async function destroySession(){ const jar=await cookies(); jar.delete(COOKIE) }
export async function getSession(): Promise<SessionUser|null>{
  const jar=await cookies(); const token=jar.get(COOKIE)?.value; if(!token) return null
  try { const {payload}=await jwtVerify(token,secret); return payload as unknown as SessionUser } catch { return null }
}
