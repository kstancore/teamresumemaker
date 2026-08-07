import { z } from "zod";

export const workItemSchema = z.object({
  role: z.string().max(160).default(""),
  organization: z.string().max(160).default(""),
  period: z.string().max(80).default(""),
  description: z.string().max(2000).default(""),
});

export type WorkHistoryItem = z.infer<typeof workItemSchema>;

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .nullable()
    .optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  work_history: z.array(workItemSchema).max(30).default([]),
});