"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SnippetForm, SnippetFormValue } from "@/components/snippet-form";
import { Spinner } from "@/components/ui";
export default function EditSnippetPage() { const { id } = useParams<{id:string}>(); const [value,setValue]=useState<SnippetFormValue|null>(null); useEffect(()=>{fetch(`/api/snippets/${id}`).then(r=>r.json()).then(d=>setValue(d.snippet));},[id]); if(!value)return <Spinner/>; return <div><PageHeader eyebrow="Code Snippets" title="Edit snippet" description="Update the code comparison and keep the reason accurate."/><SnippetForm id={id} initial={value}/></div>; }
