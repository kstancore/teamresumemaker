import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const workItemSchema = z.object({
  role: z.string().max(160).default(""),
  organization: z.string().max(160).default(""),
  period: z.string().max(80).default(""),
  description: z.string().max(2000).default(""),
});

export type WorkHistoryItem = z.infer<typeof workItemSchema>;

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  work_history: z.array(workItemSchema).max(30).default([]),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    let avatarSignedUrl: string | null = null;
    if (data?.avatar_url) {
      const signed = await context.supabase.storage
        .from("avatars")
        .createSignedUrl(data.avatar_url, 60 * 60);
      avatarSignedUrl = signed.data?.signedUrl ?? null;
    }

    return {
      profile: data,
      avatarSignedUrl,
      email: (context.claims as { email?: string } | null)?.email ?? data?.email ?? null,
    };
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert(
      {
        user_id: context.userId,
        full_name: data.full_name,
        email: data.email,
        date_of_birth: data.date_of_birth ?? null,
        avatar_url: data.avatar_url ?? null,
        work_history: data.work_history,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
