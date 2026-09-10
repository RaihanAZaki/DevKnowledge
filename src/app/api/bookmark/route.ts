import {NextResponse} from "next/server"; import prisma from "@/lib/prisma"; import {getCurrentUser} from "@/lib/auth";
export async function POST(req:Request){const user=await getCurrentUser(); if(!user)return NextResponse.json({}, {status:401}); const b=await req.json(); return NextResponse.json(await prisma.bookmark.create({data:{userId:user.id,targetId:b.targetId,type:b.type}}))}
