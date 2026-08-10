import { DoodleBackground } from "@/components/doodle-background";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getMyProfile, saveMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Camera,
  Users,
  Save,
  CalendarIcon,
  CheckCircle2,
  Pencil,
  X,
  Plus,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your Account — Team Resume Maker" },
      {
        name: "description",
        content:
          "Create your Team Resume Maker account profile: photo, name, date of birth, and email.",
      },
      { property: "og:title", content: "Your Account — Team Resume Maker" },
      {
        property: "og:description",
        content: "Set up your profile photo and details.",
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

function SpiralDivider() {
  return (
    <div className="hidden w-6 shrink-0 flex-col justify-around border-x border-border bg-muted py-8 shadow-inner md:flex">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="mx-auto h-3 w-3 rounded-full border border-border bg-card shadow-sm"
        />
      ))}
    </div>
  );
}

function ProfilePage() {
  const loadFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(saveMyProfile);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => loadFn() });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [editing, setEditing] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile?.full_name ?? "");
    setEmail(data.profile?.email ?? data.email ?? "");
    setDob(data.profile?.date_of_birth ?? "");
    setAvatarPath(data.profile?.avatar_url ?? null);
    setAvatarPreview(data.avatarSignedUrl ?? null);
    if (!initialized.current) {
      initialized.current = true;
      setEditing(!data.profile?.full_name);
    }
  }, [data]);

  const saveM = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          date_of_birth: dob ? dob : null,
          avatar_url: avatarPath,
          work_history: [],
        },
      }),
    onSuccess: (result) => {
      setFullName(result.profile.full_name);
      setEmail(result.profile.email ?? "");
      setDob(result.profile.date_of_birth ?? "");
      setAvatarPath(result.profile.avatar_url ?? null);
      setSavedAt(new Date());
      setEditing(false);

      qc.setQueryData(["my-profile"], (current: typeof data) =>
        current
          ? { ...current, profile: result.profile }
          : { profile: result.profile, avatarSignedUrl: avatarPreview, email: result.profile.email },
      );
      toast.success("Profile saved");
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

  function resetToSaved() {
    setFullName(data?.profile?.full_name ?? "");
    setEmail(data?.profile?.email ?? data?.email ?? "");
    setDob(data?.profile?.date_of_birth ?? "");
    setAvatarPath(data?.profile?.avatar_url ?? null);
    setAvatarPreview(data?.avatarSignedUrl ?? null);
    setSavedAt(null);
  }

  const displayName = fullName || "Unnamed";
  const displayEmail = email || data?.email || "No email saved";
  const displayDob = dob ? format(parseISO(dob), "PPP") : "—";

  return (
    <div className="paper isolate min-h-screen">
      <DoodleBackground />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="relative z-10 mx-auto flex max-w-6xl items-center justify-center px-4 py-8 md:px-6 md:py-12">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        ) : (
          <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_20px_50px_rgba(10,17,40,0.12)] md:flex md:h-[720px]">
            {/* Left panel — identity summary */}
            <div className="relative flex w-full flex-col items-center overflow-hidden bg-primary px-8 py-10 text-primary-foreground md:w-5/12 md:px-10 md:py-12">
              <div className="absolute left-8 top-8 -rotate-12 select-none font-hand text-4xl text-accent/20">
                Team Resume
              </div>

              {/* Polaroid avatar */}
              <div className="relative mt-6 md:mt-10">
                <div className="w-44 rotate-[-3deg] bg-card p-3 pb-8 shadow-xl transition-transform duration-300 hover:rotate-0 md:w-48">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={displayName ? `${displayName}'s profile picture` : "Profile picture"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Camera className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -right-3 -top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-accent text-sm font-bold text-primary-foreground shadow-lg">
                  Hi!
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold uppercase tracking-widest text-foreground">
                  Member
                </div>
              </div>

              <div className="mt-10 w-full space-y-6 text-center">
                <div>
                  <h1 className="font-serif text-3xl font-bold md:text-4xl">{displayName}</h1>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-accent">
                    Team Resume Maker
                  </p>
                </div>

                <div className="space-y-5 border-t border-primary-foreground/10 pt-6 text-left">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">
                      Contact
                    </span>
                    <span className="break-all text-sm font-medium leading-relaxed" title={displayEmail}>
                      {displayEmail}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">
                      Birthday
                    </span>
                    <span className="text-sm font-medium leading-relaxed">{displayDob}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto w-full space-y-4 pt-8">
                {editing ? (
                  <div className="rotate-[3deg] rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-primary-foreground shadow-lg">
                    <p className="font-hand text-lg text-accent">Editing mode on</p>
                    <p className="mt-1 text-xs opacity-80">Make changes on the right, then save.</p>
                  </div>
                ) : null}
              </div>
            </div>

            <SpiralDivider />

            {/* Right panel — details / form */}
            <div className="relative flex w-full flex-col bg-card px-6 py-8 md:w-7/12 md:px-12 md:py-12">
              {/* Lined paper background */}
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "linear-gradient(var(--border) 1.5px, transparent 1.5px)",
                  backgroundSize: "100% 2.75rem",
                }}
              />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-black text-foreground md:text-4xl">
                    {editing ? "Update Details" : "Account Details"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editing
                      ? "Update your identity across the platform."
                      : "Here are the details you saved."}
                  </p>
                </div>
                <span className="hidden select-none font-hand text-6xl font-bold text-accent/20 md:block">
                  02
                </span>
              </div>

              {!editing ? (
                <div className="relative z-10 mt-10 flex flex-1 flex-col">
                  <div className="space-y-8">
                    <div className="group">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Full Name
                      </p>
                      <p className="mt-1 border-b-2 border-border pb-2 font-serif text-xl font-medium text-foreground">
                        {fullName || "—"}
                      </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="group">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Email Address
                        </p>
                        <p className="mt-1 border-b-2 border-border pb-2 text-lg text-foreground">
                          {email || "—"}
                        </p>
                      </div>
                      <div className="group">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Birth Date
                        </p>
                        <p className="mt-1 border-b-2 border-border pb-2 text-lg text-foreground">
                          {dob ? format(parseISO(dob), "PPP") : "—"}
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-10">
                    <Button
                      type="button"
                      onClick={() => {
                        setSavedAt(null);
                        setEditing(true);
                      }}
                      className="bg-primary px-8 py-6 text-base font-bold text-primary-foreground shadow-[6px_6px_0px_var(--accent)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_var(--accent)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit details
                    </Button>
                    {savedAt ? (
                      <p
                        className="flex items-center gap-2 text-sm font-medium text-foreground"
                        role="status"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Saved at {format(savedAt, "p")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form
                  className="relative z-10 mt-10 flex flex-1 flex-col"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!fullName.trim()) return toast.error("Please enter your name");
                    if (!email.trim()) return toast.error("Please enter your email");
                    saveM.mutate();
                  }}
                >
                  <div className="space-y-8">
                    <div className="group">
                      <Label
                        htmlFor="fullName"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setSavedAt(null);
                        }}
                        maxLength={120}
                        required
                        className="mt-1 border-0 border-b-2 border-border bg-transparent px-0 font-serif text-xl font-medium text-foreground shadow-none transition-colors focus:border-accent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="group">
                        <Label
                          htmlFor="pemail"
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="pemail"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setSavedAt(null);
                          }}
                          maxLength={255}
                          required
                          className="mt-1 border-0 border-b-2 border-border bg-transparent px-0 text-lg text-foreground shadow-none transition-colors focus:border-accent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>

                      <div className="group">
                        <Label
                          htmlFor="dob"
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Birth Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="dob"
                              type="button"
                              variant="outline"
                              className={cn(
                                "mt-1 w-full justify-start border-0 border-b-2 border-border bg-transparent px-0 text-left text-lg font-normal text-foreground shadow-none hover:bg-transparent focus:border-accent focus-visible:ring-0 focus-visible:ring-offset-0",
                                !dob && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                              {dob ? format(parseISO(dob), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dob ? parseISO(dob) : undefined}
                              onSelect={(date) => {
                                setDob(date ? format(date, "yyyy-MM-dd") : "");
                                setSavedAt(null);
                              }}
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1940}
                              toYear={new Date().getFullYear()}
                              className="pointer-events-auto p-3"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Update Avatar
                      </Label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatar}
                      />
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                        >
                          {uploading ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Plus className="h-6 w-6" />
                          )}
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {avatarPreview ? "Replace current photo" : "Upload a photo"}
                          </p>
                          <p className="text-xs text-muted-foreground">JPG or PNG, up to 5MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-10">
                    <Button
                      type="submit"
                      disabled={saveM.isPending || uploading}
                      className="bg-accent px-10 py-6 text-base font-bold text-accent-foreground shadow-[6px_6px_0px_var(--primary)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_var(--primary)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveM.isPending ? "Saving…" : "Save Profile"}
                    </Button>

                    {data?.profile?.full_name ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={saveM.isPending}
                        onClick={() => {
                          resetToSaved();
                          setEditing(false);
                        }}
                        className="border-border px-6 py-6 text-sm font-semibold"
                      >
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              )}

              {/* Decorative star doodle */}
              <Star className="pointer-events-none absolute bottom-8 right-8 h-20 w-20 rotate-12 text-accent/10" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
