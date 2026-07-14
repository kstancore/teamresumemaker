import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM_PROMPT = `You are an expert resume writer. You will receive the raw text of multiple individual resumes belonging to different people who are forming a team. Combine them into ONE cohesive TEAM RESUME that presents the group as a single unified team while still crediting individual members.

Rules:
- Merge overlapping skills; deduplicate.
- Group experience by role/project; list contributors for each.
- Preserve important accomplishments with strong action verbs.
- Write a compelling team headline and 2-3 sentence team summary.
- Do NOT invent facts. If information is missing, leave the field empty or omit it.
- Output ONLY valid JSON matching the provided schema. No prose, no markdown fences.`;

const SCHEMA_HINT = `{
  "team_name": string,
  "headline": string,
  "summary": string,
  "contact": { "email"?: string, "phone"?: string, "location"?: string, "website"?: string },
  "members": [{ "name": string, "title": string, "bio": string }],
  "combined_skills": string[],
  "experience": [{ "role": string, "organization": string, "period": string, "contributors": string[], "bullets": string[] }],
  "projects": [{ "name": string, "description": string, "contributors": string[], "tech": string[] }],
  "education": [{ "degree": string, "institution": string, "period": string, "person": string }],
  "certifications": [{ "name": string, "issuer": string, "person": string }]
}`;

export const generateTeamResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ project_id: z.string().uuid() }).parse(d))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }): Promise<any> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const { data: files, error } = await context.supabase
      .from("resume_files")
      .select("original_filename, person_label, parsed_text")
      .eq("project_id", data.project_id);
    if (error) throw new Error(error.message);
    if (!files || files.length < 2) {
      throw new Error("Please upload at least 2 resumes before generating.");
    }

    const combined = files
      .map((f, i) => {
        const label = f.person_label || `Person ${i + 1}`;
        return `=== RESUME ${i + 1} — ${label} (source: ${f.original_filename}) ===\n${f.parsed_text ?? ""}`;
      })
      .join("\n\n");

    const userPrompt = `Here are ${files.length} individual resumes. Merge them into a single team resume as JSON matching this schema:\n\n${SCHEMA_HINT}\n\nResumes:\n\n${combined}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI request failed: ${text.slice(0, 200)}`);
    }

    const payload = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    let merged: unknown;
    try {
      merged = JSON.parse(raw);
    } catch {
      // try to extract JSON substring
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid response");
      merged = JSON.parse(match[0]);
    }

    const { error: upErr } = await context.supabase
      .from("projects")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ merged_resume: merged } as any)
      .eq("id", data.project_id);
    if (upErr) throw new Error(upErr.message);

    return merged;
  });
