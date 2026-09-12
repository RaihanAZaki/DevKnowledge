import {
 Trophy,
 Zap,
 Star
} from "lucide-react";


const badges=[

{
name:"Problem Solver",
icon:Trophy
},

{
name:"Helpful",
icon:Star
},

{
name:"Top Contributor",
icon:Zap
}

];


export default function UserBadges(){


return (

<div>


<h3 className="
mb-3
font-semibold
">

Badges

</h3>



<div className="flex gap-3">


{
badges.map(
(item)=>{


const Icon=item.icon;


return (

<div

key={item.name}

className="
flex
items-center
gap-2
rounded-xl
border
px-3
py-2
"

>


<Icon className="h-4 w-4"/>


<span className="text-sm">

{item.name}

</span>


</div>

)


}

)

}


</div>


</div>

)

}