import { DoodleBackground } from "@/components/doodle-background";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getMyProfile, saveMyProfile, type WorkHistoryItem } from "@/lib/profile.functions";
import { listProjects } from "@/lib/projects.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Camera, Users, Save, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your Account — Team Resume Maker" },
      {
        name: "description",
        content:
          "Create your Team Resume Maker account profile: photo, name, date of birth, email and your previous work history.",
      },
      { property: "og:title", content: "Your Account — Team Resume Maker" },
      {
        property: "og:description",
        content: "Set up your profile photo, details and work history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
});

const emptyWork: WorkHistoryItem = { role: "", organization: "", period: "", description: "" };

function ProfilePage() {
  const loadFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(saveMyProfile);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const listFn = useServerFn(listProjects);

  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => loadFn() });
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [work, setWork] = useState<WorkHistoryItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile?.full_name ?? "");
    setEmail(data.profile?.email ?? data.email ?? "");
    setDob(data.profile?.date_of_birth ?? "");
    setAvatarPath(data.profile?.avatar_url ?? null);
    setAvatarPreview(data.avatarSignedUrl ?? null);
    const wh = (data.profile?.work_history as WorkHistoryItem[] | null) ?? [];
    setWork(Array.isArray(wh) && wh.length ? wh : [{ ...emptyWork }]);
  }, [data]);

  const saveM = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          date_of_birth: dob ? dob : null,
          avatar_url: avatarPath,
          work_history: work.filter(
            (w) => w.role.trim() || w.organization.trim() || w.description.trim(),
          ),
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("You are not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const signed = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarPath(path);
      setAvatarPreview(signed.data?.signedUrl ?? null);
      toast.success("Photo uploaded — remember to save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }




  return (
    <div className="paper isolate min-h-screen">
      <DoodleBackground />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/workspace" })}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to workspace
            </Button>
            <Link to="/workspace" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-semibold">Team Resume Maker</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-serif text-3xl md:text-4xl">Your account</h1>
        <p className="mt-1 text-muted-foreground">
          Add your photo, details and previous work so they can flow into your team resumes.
        </p>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading your profile…</p>
        ) : (
          <form
            className="mt-8 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (!fullName.trim()) return toast.error("Please enter your name");
              if (!email.trim()) return toast.error("Please enter your email");
              saveM.mutate();
            }}
          >
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={fullName ? `${fullName}'s profile picture` : "Profile picture"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatar}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading…" : avatarPreview ? "Change photo" : "Upload photo"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, up to 5MB.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="pemail">Email</Label>
                  <Input
                    id="pemail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div>
                <h2 className="font-serif text-xl">Your previous work</h2>
                <p className="text-sm text-muted-foreground">
                  Team resumes you've built here in Team Resume Maker.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {projectsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading your work…</p>
                ) : !projects || projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You haven't created any team resumes yet.{" "}
                    <Link to="/workspace" className="underline">
                      Start one in your workspace
                    </Link>
                    .
                  </p>
                ) : (
                  projects.map((p) => (
                    <Link
                      key={p.id}
                      to="/workspace/$projectId"
                      params={{ projectId: p.id }}
                      className="flex items-center justify-between rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.merged_resume ? "Team resume generated" : "Draft — not generated yet"} ·
                          Updated {new Date(p.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                        <FileText className="h-4 w-4" />
                        {p.template}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <Button
              type="submit"
              disabled={saveM.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveM.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
