"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  MessageSquare,
  Trophy,
  X
} from "lucide-react";


const notifications = [
  {
    id:1,
    title:"Your answer was accepted",
    message:"Your solution on JWT discussion was accepted",
    type:"success",
    time:"2 minutes ago"
  },
  {
    id:2,
    title:"New reply",
    message:"Budi replied to your discussion",
    type:"reply",
    time:"10 minutes ago"
  },
  {
    id:3,
    title:"New badge earned",
    message:"You earned Problem Solver badge",
    type:"badge",
    time:"1 hour ago"
  }
];


export default function NotificationBell(){


const [open,setOpen]=useState(false);


return (

<div className="relative">


<button

onClick={()=>setOpen(!open)}

className="
relative
grid
h-10
w-10
place-items-center
rounded-xl
border
border-[var(--border)]
bg-[var(--surface)]
hover:bg-[var(--surface-soft)]
"

>


<Bell className="h-4 w-4"/>


<span

className="
absolute
right-2
top-2
h-2
w-2
rounded-full
bg-red-500
"

/>


</button>



{
open &&


<div

className="
absolute
right-0
top-12
z-50
w-80
overflow-hidden
rounded-2xl
border
border-[var(--border)]
bg-[var(--surface)]
shadow-xl
"

>


<div

className="
flex
items-center
justify-between
border-b
border-[var(--border)]
p-4
"

>

<span className="font-semibold">

Notifications

</span>


<button>

<X className="h-4 w-4"/>

</button>

</div>




<div className="divide-y">


{
notifications.map(item=>(


<div

key={item.id}

className="
flex
gap-3
p-4
hover:bg-[var(--surface-soft)]
"

>


<div

className="
grid
h-9
w-9
place-items-center
rounded-xl
bg-[var(--primary-soft)]
"

>


{
item.type==="reply"

?

<MessageSquare className="h-4 w-4"/>

:

item.type==="badge"

?

<Trophy className="h-4 w-4"/>

:

<Check className="h-4 w-4"/>

}


</div>



<div>


<p className="text-sm font-medium">

{item.title}

</p>


<p className="
mt-1
text-xs
text-[var(--text-soft)]
">

{item.message}

</p>


<p className="
mt-2
text-xs
text-[var(--text-muted)]
">

{item.time}

</p>


</div>


</div>


))

}


</div>



<button

className="
w-full
border-t
border-[var(--border)]
p-3
text-sm
font-medium
text-[var(--primary)]
"

>

Mark all as read

</button>



</div>


}


</div>


)

}