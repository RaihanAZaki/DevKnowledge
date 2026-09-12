"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Plus,
  X,
  MessageSquare,
  FileText,
  Code2,
  ChevronLeft
} from "lucide-react";


export default function FloatingAction(){

  const [open,setOpen] = useState(false);
  const [createOpen,setCreateOpen] = useState(false);



  function closeMenu(){

    setOpen(false);
    setCreateOpen(false);

  }


  return (

<div
className="
fixed
bottom-8
right-8
z-50
flex
flex-col
items-end
gap-3
"
>


{/* CREATE MENU */}

{
createOpen && (

<div
className="
flex
flex-col
items-end
gap-3
"
>


<button
onClick={()=>setCreateOpen(false)}
className="
flex
items-center
gap-2
rounded-full
border
bg-[var(--surface)]
px-5
py-3
text-sm
shadow-lg
"
>
<ChevronLeft className="h-4 w-4"/>
Back
</button>



<Link
href="/forum/new"
className="
flex
items-center
gap-2
rounded-full
bg-[var(--text)]
px-5
py-3
text-sm
text-white
shadow-lg
"
>
<MessageSquare className="h-4 w-4"/>
New Discussion
</Link>



<Link
href="/documentation/new"
className="
flex
items-center
gap-2
rounded-full
border
bg-[var(--surface)]
px-5
py-3
text-sm
shadow-lg
"
>
<FileText className="h-4 w-4"/>
New Documentation
</Link>



<Link
href="/snippets/new"
className="
flex
items-center
gap-2
rounded-full
border
bg-[var(--surface)]
px-5
py-3
text-sm
shadow-lg
"
>
<Code2 className="h-4 w-4"/>
New Snippet
</Link>


</div>

)

}




{/* MAIN MENU */}

{
open && !createOpen && (

<div
className="
flex
flex-col
items-end
gap-3
"
>


<Link
href="/ai-chat"
className="
flex
items-center
gap-2
rounded-full
border
bg-[var(--surface)]
px-5
py-3
text-sm
shadow-lg
"
>
<MessageSquare className="h-4 w-4"/>
AI Chat
</Link>



<button
onClick={()=>setCreateOpen(true)}
className="
flex
items-center
gap-2
rounded-full
bg-[var(--text)]
px-5
py-3
text-sm
text-white
shadow-lg
"
>
<Plus className="h-4 w-4"/>
Create
</button>


</div>

)

}





{/* FLOAT BUTTON */}

<button

onClick={()=>{

if(open){
closeMenu();
}else{
setOpen(true);
}

}}

className="
grid
h-14
w-14
place-items-center
rounded-full
bg-[var(--text)]
text-white
shadow-xl
transition
hover:scale-105
"

>

{
open
?
<X className="h-6 w-6"/>
:
<Plus className="h-6 w-6"/>
}


</button>



</div>

  );

}