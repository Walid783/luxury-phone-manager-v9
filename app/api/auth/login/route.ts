import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
export async function POST(req:Request){const f=await req.formData();const email=String(f.get('email')||'').toLowerCase();const password=String(f.get('password')||'');const u=await prisma.user.findUnique({where:{email}});if(!u||!u.active||!(await bcrypt.compare(password,u.passwordHash)))return NextResponse.redirect(new URL('/login?error=1',req.url),303);await createSession({id:u.id,name:u.name,email:u.email,role:u.role});await audit({userId:u.id,action:'LOGIN',entity:'User',entityId:u.id,detail:'Connexion atelier',ip:req.headers.get('x-forwarded-for')});return NextResponse.redirect(new URL('/',req.url),303)}
