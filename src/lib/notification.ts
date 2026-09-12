import {prisma} from "./prisma";


export async function createNotification(
userId:string,
title:string,
message:string,
type:string,
referenceId?:string
){


return prisma.notification.create({

data:{
 userId,
 title,
 message,
 type,
 referenceId
}

});


}