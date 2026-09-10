"use client";
import { useParams } from "next/navigation";
import { useEffect,useState } from "react";
import { DocumentForm, DocumentFormValue } from "@/components/document-form";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui";
export default function EditDocumentPage(){ const {id}=useParams<{id:string}>(); const [value,setValue]=useState<DocumentFormValue|null>(null); useEffect(()=>{fetch(`/api/documentation/${id}`).then(r=>r.json()).then(d=>setValue(d.document))},[id]); if(!value)return <Spinner/>; return <div><PageHeader eyebrow="Documentation" title="Edit document" description="Keep the guide accurate and useful for the next developer."/><DocumentForm id={id} initial={value}/></div>; }
