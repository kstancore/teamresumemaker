import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getProject,
  addResumeFile,
  deleteResumeFile,
  saveMergedResume,
  renameProject,
} from "@/lib/projects.functions";
import { generateTeamResume } from "@/lib/ai-merge.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Trash2,
  FileText,
  Download,
  Loader2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { extractTextFromFile } from "@/lib/file-parsing";
import {
  ModernTemplate,
  ClassicTemplate,
  CompactTemplate,
  CoverPage,
} from "@/components/resume-templates";
import type { TeamResume, TemplateId } from "@/lib/resume-types";
import { emptyTeamResume } from "@/lib/resume-types";
import { downloadPdf, downloadDocx } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/workspace/$projectId")({
  component: Editor,
});

function Editor() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getProject);
  const addFileFn = useServerFn(addResumeFile);
  const delFileFn = useServerFn(deleteResumeFile);
  const saveFn = useServerFn(saveMergedResume);
  const renameFn = useServerFn(renameProject);
  const generateFn = useServerFn(generateTeamResume);

  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getFn({ data: { id: projectId } }),
  });

  const [resume, setResume] = useState<TeamResume | null>(null);
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [name, setName] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data) return;
    setName(data.project.name);
    setTemplate((data.project.template as TemplateId) ?? "modern");
    const merged = data.project.merged_resume as unknown;
    if (merged && typeof merged === "object") {
      setResume({ ...emptyTeamResume, ...(merged as Partial<TeamResume>) });
    } else {
      setResume(null);
    }
  }, [data]);

  // Debounced autosave of resume + template
  useEffect(() => {
    if (!resume || !data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFn({
        data: { id: projectId, merged_resume: resume, template },
      }).catch((e) => toast.error(e instanceof Error ? e.message : "Autosave failed"));
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, template]);

  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    try {
      const { data: sess, error: sessErr } = await supabase.auth.getUser();
      if (sessErr) {
        console.error("[upload] auth error", sessErr);
        toast.error("You must be signed in to upload.");
        return;
      }
      const uid = sess.user?.id;
      if (!uid) {
        toast.error("You must be signed in to upload.");
        return;
      }

      for (const file of Array.from(files)) {
        console.log("[upload] processing", file.name, file.size);
        if (!/\.(pdf|docx)$/i.test(file.name)) {
          toast.error(`${file.name}: only PDF or DOCX supported`);
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name}: file too large (max 15MB)`);
          continue;
        }
        try {
          const text = await extractTextFromFile(file);
          console.log("[upload] extracted", file.name, "chars:", text.length);
          if (!text || text.length < 20) {
            toast.error(
              `${file.name}: couldn't extract text. If this is a scanned PDF, please upload a text-based PDF or DOCX.`,
            );
            continue;
          }
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${uid}/${projectId}/${Date.now()}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from("resumes")
            .upload(path, file, {
              upsert: false,
              contentType: file.type || undefined,
            });
          if (upErr) {
            console.error("[upload] storage error", upErr);
            throw upErr;
          }

          await addFileFn({
            data: {
              project_id: projectId,
              original_filename: file.name,
              storage_path: path,
              parsed_text: text.slice(0, 20000),
              person_label: file.name.replace(/\.(pdf|docx)$/i, ""),
            },
          });
          toast.success(`Added ${file.name}`);
        } catch (e) {
          console.error("[upload] failed", file.name, e);
          toast.error(
            `${file.name}: ${e instanceof Error ? e.message : "upload failed"}`,
          );
        }
      }
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    } catch (e) {
      console.error("[upload] fatal", e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }


  async function handleGenerate() {
    if (!data || data.files.length < 2) {
      toast.error("Upload at least 2 resumes first");
      return;
    }
    setGenerating(true);
    try {
      const merged = await generateFn({ data: { project_id: projectId } });
      setResume({ ...emptyTeamResume, ...(merged as Partial<TeamResume>) });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Team resume generated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const delFile = useMutation({
    mutationFn: (id: string) => delFileFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  async function handleRename() {
    if (!name.trim() || !data || name === data.project.name) return;
    try {
      await renameFn({ data: { id: projectId, name: name.trim() } });
      qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/workspace" })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/workspace" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Users className="h-3.5 w-3.5" />
              </div>
            </Link>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="max-w-sm border-transparent bg-transparent font-serif text-lg font-semibold shadow-none focus-visible:border-input"
            />
          </div>
          <div className="flex items-center gap-2">
            {resume && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPdf(resume, `${name || "team-resume"}.pdf`)}
                >
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadDocx(resume, `${name || "team-resume"}.docx`)}
                >
                  <Download className="mr-2 h-4 w-4" /> DOCX
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[380px_1fr]">
        {/* Left panel */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-lg">Uploaded resumes</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload 2 or more PDF/DOCX resumes to combine.
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:border-accent">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {uploading ? "Uploading…" : "Click to upload"}
              </span>
              <span className="text-xs text-muted-foreground">PDF or DOCX</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            <ul className="mt-4 space-y-2">
              {data.files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm"
                >
                  <FileText className="h-4 w-4 flex-none text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{f.original_filename}</span>
                  <button
                    onClick={() => delFile.mutate(f.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {data.files.length === 0 && (
                <li className="text-xs text-muted-foreground">No resumes uploaded yet.</li>
              )}
            </ul>

            <Button
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={data.files.length < 2 || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {resume ? "Regenerate with AI" : "Generate team resume"}
                </>
              )}
            </Button>
          </section>

          {resume && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-serif text-lg">Template</h2>
              <Tabs
                value={template}
                onValueChange={(v) => setTemplate(v as TemplateId)}
                className="mt-3"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="modern">Modern</TabsTrigger>
                  <TabsTrigger value="classic">Classic</TabsTrigger>
                  <TabsTrigger value="compact">Compact</TabsTrigger>
                </TabsList>
              </Tabs>
            </section>
          )}

          {resume && (
            <ResumeFields resume={resume} onChange={setResume} />
          )}
        </aside>

        {/* Right: preview */}
        <div className="min-w-0">
          {resume ? (
            <div className="space-y-4 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4">
              <CoverPage resume={resume} />
              {template === "modern" && <ModernTemplate resume={resume} />}
              {template === "classic" && <ClassicTemplate resume={resume} />}
              {template === "compact" && <CompactTemplate resume={resume} />}
            </div>
          ) : (
            <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="max-w-sm">
                <Sparkles className="mx-auto h-10 w-10 text-accent" />
                <h3 className="mt-4 font-serif text-xl">No team resume yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload at least two individual resumes and click <b>Generate</b> to have AI
                  combine them into a single team resume.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeFields({
  resume,
  onChange,
}: {
  resume: TeamResume;
  onChange: (r: TeamResume) => void;
}) {
  const update = (patch: Partial<TeamResume>) => onChange({ ...resume, ...patch });

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-lg">Edit content</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Changes auto-save and update the preview live.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <Label>Team name</Label>
          <Input
            value={resume.team_name}
            onChange={(e) => update({ team_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Headline</Label>
          <Input
            value={resume.headline}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </div>
        <div>
          <Label>Summary</Label>
          <Textarea
            rows={4}
            value={resume.summary}
            onChange={(e) => update({ summary: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Email</Label>
            <Input
              value={resume.contact.email ?? ""}
              onChange={(e) =>
                update({ contact: { ...resume.contact, email: e.target.value } })
              }
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={resume.contact.phone ?? ""}
              onChange={(e) =>
                update({ contact: { ...resume.contact, phone: e.target.value } })
              }
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={resume.contact.location ?? ""}
              onChange={(e) =>
                update({ contact: { ...resume.contact, location: e.target.value } })
              }
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={resume.contact.website ?? ""}
              onChange={(e) =>
                update({ contact: { ...resume.contact, website: e.target.value } })
              }
            />
          </div>
        </div>
        <div>
          <Label>Skills (comma-separated)</Label>
          <Textarea
            rows={3}
            value={resume.combined_skills.join(", ")}
            onChange={(e) =>
              update({
                combined_skills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">
          Advanced: edit raw JSON
        </summary>
        <Textarea
          rows={10}
          className="mt-2 font-mono text-xs"
          value={JSON.stringify(resume, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange({ ...emptyTeamResume, ...parsed });
            } catch {
              // ignore parse errors while typing
            }
          }}
        />
      </details>
    </section>
  );
}

