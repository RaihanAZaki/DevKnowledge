import { prisma } from "./prisma";


export async function addReputation(
 userId:string,
 action:string,
 points:number,
 referenceId?:string
){

 await prisma.$transaction([

 prisma.userReputation.upsert({

 where:{
  userId
 },

 update:{
  score:{
   increment:points
  }
 },

 create:{
  userId,
  score:points
 }

 }),



 prisma.reputationHistory.create({

 data:{
  userId,
  action,
  points,
  referenceId
 }

 })

 ]);

}