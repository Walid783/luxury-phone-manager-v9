import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'lpm_session'
export type SessionUser = { id:string; name:string; email:string; role:'ADMIN'|'TECHNICIAN' }

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32 || secret === 'dev-secret-change-me') {
    throw new Error('AUTH_SECRET must be securely configured (at least 32 characters)')
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(getSigningKey())
  const jar = await cookies()
  jar.set(COOKIE, token, { httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', path:'/', maxAge:60*60*24*7 })
}
export async function destroySession(){ const jar=await cookies(); jar.delete(COOKIE) }
export async function getSession(): Promise<SessionUser|null>{
  const jar=await cookies(); const token=jar.get(COOKIE)?.value; if(!token) return null
  try { const {payload}=await jwtVerify(token,getSigningKey()); return payload as unknown as SessionUser } catch { return null }
}
