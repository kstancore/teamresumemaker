import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id, name, template, updated_at, merged_resume")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [proj, files] = await Promise.all([
      context.supabase.from("projects").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("resume_files")
        .select("id, original_filename, person_label, created_at")
        .eq("project_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (proj.error) throw new Error(proj.error.message);
    if (!proj.data) throw new Error("Project not found");
    return { project: proj.data, files: files.data ?? [] };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({ user_id: context.userId, name: data.name })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveMergedResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        merged_resume: z.unknown().optional(),
        template: z.enum(["modern", "classic", "compact"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: { merged_resume?: unknown; template?: string } = {};
    if (data.merged_resume !== undefined) update.merged_resume = data.merged_resume;
    if (data.template !== undefined) update.template = data.template;
    const { error } = await context.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("projects")
      .update(update as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addResumeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        original_filename: z.string().min(1),
        storage_path: z.string().min(1),
        parsed_text: z.string(),
        person_label: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("resume_files")
      .insert({
        project_id: data.project_id,
        user_id: context.userId,
        original_filename: data.original_filename,
        storage_path: data.storage_path,
        parsed_text: data.parsed_text,
        person_label: data.person_label ?? null,
      })
      .select("id, original_filename, person_label, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteResumeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // fetch storage path first
    const { data: row } = await context.supabase
      .from("resume_files")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await context.supabase.storage.from("resumes").remove([row.storage_path]);
    }
    const { error } = await context.supabase.from("resume_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
