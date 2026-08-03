import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Users, Download } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="paper min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </div>
            <span className="font-serif text-lg font-semibold">Team Resume Maker</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
              One team.
              <br />
              <span className="text-accent">One resume.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Combine multiple resumes into a single, polished team resume. Upload PDFs or DOCX
              files, let AI merge them into a unified story, then edit, restyle, and export.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Build your team resume
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Upload any resume",
                body: "Drop in PDFs or DOCX files. We extract each person's story automatically.",
              },
              {
                icon: Sparkles,
                title: "AI merges intelligently",
                body: "The AI combines skills, credits contributors, and writes a cohesive team narrative.",
              },
              {
                icon: Download,
                title: "Edit & export",
                body: "Fine-tune any field, switch between templates, and download as PDF or DOCX.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-serif text-4xl">Ready to build your team's resume?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign up free and generate your first team resume in minutes.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-8 inline-block">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get started
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Team Resume Maker
      </footer>
    </div>
  );
}
