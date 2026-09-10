"use client";
import {useState} from "react";
export function BookmarkButton({targetId,type}:{targetId:string;type:"SNIPPET"|"DOCUMENTATION"|"FORUM"}){
 const [saved,setSaved]=useState(false);
 async function save(){const r=await fetch("/api/bookmark",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetId,type})}); if(r.ok)setSaved(true)}
 return <button onClick={save} className="rounded-xl border px-3 py-2 text-sm">{saved?"★ Saved":"☆ Bookmark"}</button>
}
