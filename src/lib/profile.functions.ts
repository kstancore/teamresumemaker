import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileSchema } from "@/lib/profile.schemas";
export type { WorkHistoryItem } from "@/lib/profile.schemas";

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
    const { data: savedProfile, error } = await context.supabase.from("profiles").upsert(
      {
        user_id: context.userId,
        full_name: data.full_name,
        email: data.email,
        date_of_birth: data.date_of_birth ?? null,
        avatar_url: data.avatar_url ?? null,
        work_history: data.work_history,
      },
      { onConflict: "user_id" },
    ).select("*").single();
    if (error) throw new Error(error.message);
    return { ok: true, profile: savedProfile };
  });
