import { z } from "zod";
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(300).optional().nullable(),
});
