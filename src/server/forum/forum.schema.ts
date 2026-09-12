import { z } from "zod";
import { CATEGORY_OPTIONS } from "@/lib/constants";

export const forumThreadSchema = z.object({
  title: z.string().trim().min(5).max(180),
  content: z.string().trim().min(5).max(20000),
  category: z.enum(CATEGORY_OPTIONS),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
});

export const forumCommentSchema = z.object({
  content: z.string().trim().min(2).max(10000),
});

export type ForumThreadInput = z.infer<typeof forumThreadSchema>;
