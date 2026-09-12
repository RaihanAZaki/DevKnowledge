import { z } from "zod";
import { CATEGORY_OPTIONS } from "@/lib/constants";

export const snippetSchema = z.object({
  ticketNo: z.string().trim().min(1).max(60),
  title: z.string().trim().min(3).max(180),
  description: z.string().max(2000).optional().nullable(),
  reason: z.string().trim().min(3).max(8000),
  impact: z.string().max(4000).optional().nullable(),
  language: z.string().trim().min(1).max(50),
  framework: z.string().max(80).optional().nullable(),
  category: z.enum(CATEGORY_OPTIONS),
  beforeCode: z.string().max(50000),
  afterCode: z.string().max(50000),
});

export type SnippetInput = z.infer<typeof snippetSchema>;
