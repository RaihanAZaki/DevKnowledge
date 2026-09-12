"use client";


import {
 Trophy,
 Star,
 MessageCircle,
 CheckCircle
} from "lucide-react";


export default function ReputationCard(){


return (

<div

className="
rounded-2xl
border
border-[var(--border)]
bg-[var(--surface)]
p-5
"

>


<div className="flex items-center gap-3">


<div

className="
grid
h-12
w-12
place-items-center
rounded-xl
bg-[var(--primary-soft)]
text-[var(--primary)]
"

>

<Trophy/>

</div>



<div>

<p className="
text-sm
text-[var(--text-muted)]
">

Reputation

</p>


<h2 className="
text-2xl
font-semibold
">

320

</h2>


</div>


</div>




<div className="
mt-5
grid
grid-cols-3
gap-3
"


>


<div>

<p className="text-xs text-muted">

Threads

</p>

<strong>

12

</strong>

</div>



<div>

<p className="text-xs">

Replies

</p>

<strong>

48

</strong>

</div>



<div>

<p className="text-xs">

Solved

</p>

<strong>

8

</strong>

</div>


</div>


</div>


)

}