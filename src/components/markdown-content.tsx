"use client";
import ReactMarkdown from "react-markdown";
export function MarkdownContent({ content }: { content: string }) { return <div className="prose-soft"><ReactMarkdown>{content}</ReactMarkdown></div>; }
