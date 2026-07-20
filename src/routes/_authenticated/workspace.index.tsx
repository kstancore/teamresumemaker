import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProjects,
  createProject,
  deleteProject,
} from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FilePlus2, Trash2, LogOut, Users, FileText, ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/workspace/")({
  component: Workspace,
});

function Workspace() {
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const deleteFn = useServerFn(deleteProject);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
  });

  const createM = useMutation({
    mutationFn: (name: string) => createFn({ data: { name } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setNewName("");
      navigate({
        to: "/workspace/$projectId",
        params: { projectId: row.id },
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to home
            </Button>
            <Link to="/workspace" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-semibold">Team Resume Maker</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl">Your team resumes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new project, upload resumes, and let AI combine them.
            </p>
          </div>
        </div>

        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createM.mutate(newName.trim());
          }}
        >
          <Input
            placeholder="New project name (e.g. Founding Team Resume)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="max-w-md"
          />
          <Button
            type="submit"
            disabled={createM.isPending || !newName.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FilePlus2 className="mr-2 h-4 w-4" /> New project
          </Button>
        </form>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <div className="col-span-full text-sm text-muted-foreground">Loading…</div>
          )}
          {!isLoading && projects && projects.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No projects yet. Create your first team resume above.
            </div>
          )}
          {projects?.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-accent"
            >
              <Link
                to="/workspace/$projectId"
                params={{ projectId: p.id }}
                className="flex-1"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.merged_resume ? "Generated" : "Draft"} · updated{" "}
                      {new Date(p.updated_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {p.template} template
                    </p>
                  </div>
                </div>
              </Link>
              <div className="mt-4 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete "{p.name}" and all uploaded resumes for it. This can't be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteM.mutate(p.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
