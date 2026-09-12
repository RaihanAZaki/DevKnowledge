import { z } from "zod";
import { CATEGORY_OPTIONS } from "@/lib/constants";

export const documentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().trim().min(3).max(100000),
  language: z.string().trim().min(1).max(50),
  category: z.enum(CATEGORY_OPTIONS),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  isPublished: z.boolean().default(true),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const documentShareSchema = z.object({
  userId: z.string().min(1),
});

export type DocumentInput = z.infer<typeof documentSchema>;
