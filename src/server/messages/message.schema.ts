import { z } from "zod";

export const knowledgeAttachmentSchema = z.object({
  type: z.enum(["SNIPPET", "DOCUMENTATION", "FORUM"]),
  id: z.string().min(1),
});

export const messageSchema = z
  .object({
    content: z.string().trim().max(5000).default(""),
    attachment: knowledgeAttachmentSchema.nullish(),
  })
  .refine((value) => value.content.length > 0 || Boolean(value.attachment), {
    message: "Message or knowledge attachment is required.",
  });
