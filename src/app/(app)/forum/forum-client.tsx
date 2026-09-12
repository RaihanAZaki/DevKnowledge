"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  FolderKanban,
  MessageSquareText,
  Plus,
  Search,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Badge,
  EmptyState,
  Spinner,
} from "@/components/ui";

import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
} from "@/lib/constants";

import {
  formatDate,
} from "@/lib/format";


type Thread = {
  id: string;
  title: string;
  content: string;
  language?: string;
  category: keyof typeof CATEGORY_LABEL;
  tags: string[];

  updatedAt: string;

  author: {
    name: string;
  };

  _count: {
    comments: number;
  };

  comments: {
    id: string;
  }[];
};



export default function ForumClient({ initialItems }: { initialItems: Thread[] }) {


  const [items] =
    useState<Thread[] | null>(initialItems);



  const [search,setSearch] =
    useState("");

  const [searchOpen,setSearchOpen] =
    useState(false);



  const [categoryOpen,setCategoryOpen] =
    useState(false);


  const [languageOpen,setLanguageOpen] =
    useState(false);



  const [selectedCategories,setSelectedCategories] =
    useState<string[]>([]);


  const [selectedLanguages,setSelectedLanguages] =
    useState<string[]>([]);




  const languages = useMemo(()=>{

    return Array.from(
      new Set(
        (items ?? [])
          .map(
            item=>item.language
          )
          .filter(Boolean)
      )
    );

  },[items]);






  function toggleCategory(
    value:string
  ){

    setSelectedCategories(prev=>

      prev.includes(value)

      ?
      prev.filter(
        item=>item!==value
      )

      :
      [
        ...prev,
        value
      ]

    );

  }





  function toggleLanguage(
    value:string
  ){

    setSelectedLanguages(prev=>

      prev.includes(value)

      ?
      prev.filter(
        item=>item!==value
      )

      :
      [
        ...prev,
        value
      ]

    );

  }





  const filtered =
    useMemo(()=>{


      return (items ?? [])
      .filter(item=>{


        const keyword =
          search
          .toLowerCase();



        const matchSearch =

          !keyword ||

          `
          ${item.title}
          ${item.content}
          ${item.tags.join(" ")}
          ${item.language ?? ""}
          `
          .toLowerCase()
          .includes(keyword);





        const matchCategory =

          selectedCategories.length === 0 ||

          selectedCategories.includes(
            item.category
          );





        const matchLanguage =

          selectedLanguages.length === 0 ||

          selectedLanguages.includes(
            item.language ?? ""
          );




        return (

          matchSearch &&

          matchCategory &&

          matchLanguage

        );


      });


    },[
      items,
      search,
      selectedCategories,
      selectedLanguages
    ]);








return (

<div>


<PageHeader

eyebrow="Community"

title="Forum Discussions"

description="Ask implementation questions, compare approaches, and keep accepted solutions discoverable."

action={

<Link

href="/forum/new"

className="
inline-flex
items-center
gap-2
rounded-xl
bg-[var(--text)]
px-4
py-2.5
text-sm
font-medium
text-[var(--surface)]
"

>

<Plus className="h-4 w-4"/>

New discussion

</Link>

}

/>





{/* FILTER */}


<div

className="
mb-7
flex
justify-end
border-b
border-[var(--border)]
pb-5
"

>


<div

className="
flex
items-center
gap-2
"

>




{/* SEARCH */}


<div

className={`
flex
h-10
items-center
overflow-hidden
rounded-xl
border
bg-[var(--surface)]

transition-all

${
searchOpen

?

"w-64 border-[var(--primary)]"

:

"w-10 border-[var(--border)]"

}

`}

>


<button

onClick={()=>setSearchOpen(true)}

className="
grid
h-10
w-10
place-items-center
text-[var(--text-muted)]
"

>

<Search className="h-4 w-4"/>

</button>



{
searchOpen &&

<>

<input

autoFocus

value={search}

onChange={
e=>setSearch(
e.target.value
)
}

placeholder="Search discussion..."

className="
flex-1
bg-transparent
text-sm
outline-none
"

/>



<button

onClick={()=>{

setSearch("");

setSearchOpen(false);

}}

>

<X className="h-4 w-4"/>

</button>


</>

}



</div>








{/* CATEGORY */}


<div className="relative">


<button

onClick={()=>{

setCategoryOpen(
!categoryOpen
);

setLanguageOpen(false);

}}

className="
flex
h-10
items-center
gap-2
rounded-xl
border
border-[var(--border)]
bg-[var(--surface)]
px-3
"

>

<FolderKanban className="h-4 w-4"/>


{
selectedCategories.length > 0 &&

<span className="text-xs">

{selectedCategories.length}

</span>

}


<ChevronDown className="h-4 w-4"/>

</button>




{
categoryOpen &&

<div

className="
absolute
right-0
top-12
z-30
w-56
rounded-xl
border
border-[var(--border)]
bg-[var(--surface)]
p-3
shadow-xl
"

>


{
CATEGORY_OPTIONS.map(item=>(


<label

key={item}

className="
flex
cursor-pointer
items-center
gap-3
rounded-lg
px-2
py-2
hover:bg-[var(--surface-soft)]
"

>


<input

type="checkbox"

className="hidden"

checked={
selectedCategories.includes(item)
}

onChange={()=>toggleCategory(item)}

/>



<div

className={`
flex
h-4
w-4
items-center
justify-center
rounded
border

${
selectedCategories.includes(item)

?

"bg-[var(--primary)] text-white"

:

""

}

`}

>

{
selectedCategories.includes(item)

&&

<Check className="h-3 w-3"/>

}

</div>



<span className="text-sm">

{CATEGORY_LABEL[item]}

</span>



</label>


))

}



</div>

}


</div>









{/* LANGUAGE */}


<div className="relative">


<button

onClick={()=>{

setLanguageOpen(
!languageOpen
);

setCategoryOpen(false);

}}

className="
flex
h-10
items-center
gap-2
rounded-xl
border
border-[var(--border)]
bg-[var(--surface)]
px-3
"

>


<Code2 className="h-4 w-4"/>


{
selectedLanguages.length > 0 &&

<span className="text-xs">

{selectedLanguages.length}

</span>

}



<ChevronDown className="h-4 w-4"/>


</button>






{
languageOpen &&

<div

className="
absolute
right-0
top-12
z-30
w-48
rounded-xl
border
border-[var(--border)]
bg-[var(--surface)]
p-3
shadow-xl
"

>


{
languages.map(lang=>(


<label

key={lang}

className="
flex
cursor-pointer
items-center
gap-3
rounded-lg
px-2
py-2
hover:bg-[var(--surface-soft)]
"

>


<input

type="checkbox"

className="hidden"

checked={
selectedLanguages.includes(
lang ?? ""
)
}

onChange={()=>toggleLanguage(
lang ?? ""
)}

/>




<div

className={`
flex
h-4
w-4
items-center
justify-center
rounded
border

${
selectedLanguages.includes(lang ?? "")

?

"bg-[var(--primary)] text-white"

:

""

}

`}

>


{
selectedLanguages.includes(lang ?? "")

&&

<Check className="h-3 w-3"/>

}


</div>



<span className="text-sm">

{lang}

</span>


</label>


))

}



</div>

}


</div>





</div>


</div>







{
!items

?

<Spinner/>

:


filtered.length===0

?

<EmptyState

title="No discussions found"

description="Start a discussion or change your filters."

action={

<Link

href="/forum/new"

className="
text-sm
font-medium
text-[var(--primary)]
"

>

Start discussion

</Link>

}

/>


:


<div

className="
overflow-hidden
rounded-2xl
border
border-[var(--border)]
bg-[var(--surface)]
divide-y
divide-[var(--border)]
"

>


{
filtered.map(item=>(


<Link

key={item.id}

href={`/forum/${item.id}`}

className="
group
flex
gap-4
px-5
py-5
transition
hover:bg-[var(--surface-soft)]
"

>


<span

className="
mt-0.5
grid
h-9
w-9
shrink-0
place-items-center
rounded-xl
bg-[var(--primary-soft)]
text-[var(--primary)]
"

>

<MessageSquareText className="h-4 w-4"/>

</span>




<div className="min-w-0 flex-1">


<div className="flex flex-wrap gap-2">


<Badge>

{CATEGORY_LABEL[item.category]}

</Badge>


{
item.language &&

<Badge>

{item.language}

</Badge>

}


</div>




<h2 className="mt-2 font-medium">

{item.title}

</h2>



<p className="
mt-1
line-clamp-2
text-sm
leading-6
text-[var(--text-soft)]
">

{item.content}

</p>




<div

className="
mt-3
flex
gap-3
text-xs
text-[var(--text-muted)]
"

>


<span>

{item.author.name}

</span>


<span>

{item._count.comments} replies

</span>


<span>

{formatDate(item.updatedAt)}

</span>


</div>




</div>





<ArrowRight

className="
mt-2
h-4
w-4
text-[var(--text-muted)]
transition
group-hover:translate-x-1
"

/>



</Link>


))

}



</div>

}


</div>

);

}