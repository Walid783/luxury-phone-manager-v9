import { prisma } from '@/lib/prisma'

export async function audit(input:{userId?:string|null;action:any;entity:string;entityId?:string|null;detail?:string|null;ip?:string|null}){
  try { await prisma.auditLog.create({data:{userId:input.userId||null,action:input.action,entity:input.entity,entityId:input.entityId||null,detail:input.detail||null,ip:input.ip||null}}) } catch { /* audit must never block workshop actions */ }
}
