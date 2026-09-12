import { z } from "zod";
export const bookmarkSchema = z.object({
  targetId: z.string().min(1),
  type: z.enum(["SNIPPET", "DOCUMENTATION", "FORUM"]),
});
