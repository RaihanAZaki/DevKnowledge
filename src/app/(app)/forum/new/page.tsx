"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "@/lib/constants";

export default function NewForumPage(){
 const router=useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError("");const f=new FormData(e.currentTarget);const response=await fetch("/api/forum",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:f.get("title"),content:f.get("content"),category:f.get("category"),tags:String(f.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean)})});const data=await response.json();if(!response.ok){setError(data.error??"Unable to create discussion.");setLoading(false);return}router.push(`/forum/${data.thread.id}`)}
 return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Forum" title="Start a discussion" description="Give enough context so another developer can reproduce the problem or understand the trade-off."/><form onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"><div><Label>Title</Label><Input name="title" placeholder="What is the best way to..." required/></div><div><Label>Category</Label><select name="category" className="field h-11 px-3.5 text-sm" defaultValue="GENERAL">{CATEGORY_OPTIONS.map(item=><option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}</select></div><div><Label>Tags</Label><Input name="tags" placeholder="api, architecture, java"/></div><div><Label>Question / context</Label><Textarea name="content" className="min-h-[260px]" placeholder="Describe the problem, what you tried, and what you want to understand..." required/></div>{error?<div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">{error}</div>:null}<div className="flex items-center justify-between"><Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)]"><ArrowLeft className="h-4 w-4"/> Cancel</Link><Button disabled={loading}>{loading?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Publish discussion</Button></div></form></div>;
}
