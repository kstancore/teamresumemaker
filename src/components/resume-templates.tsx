import type { TeamResume } from "@/lib/resume-types";

interface Props {
  resume: TeamResume;
}

export function ModernTemplate({ resume }: Props) {
  return (
    <div className="mx-auto max-w-[820px] bg-white p-12 font-sans text-[#1a1f36] shadow-sm print:shadow-none">
      <header className="border-b-2 border-[#c9884a] pb-6">
        <h1 className="font-serif text-4xl font-bold text-[#1a1f36]">{resume.team_name}</h1>
        {resume.headline && (
          <p className="mt-2 text-lg text-[#c9884a]">{resume.headline}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4a5170]">
          {resume.contact.email && <span>{resume.contact.email}</span>}
          {resume.contact.phone && <span>{resume.contact.phone}</span>}
          {resume.contact.location && <span>{resume.contact.location}</span>}
          {resume.contact.website && <span>{resume.contact.website}</span>}
        </div>
      </header>

      {resume.summary && (
        <Section title="Team Summary">
          <p className="text-sm leading-relaxed">{resume.summary}</p>
        </Section>
      )}

      {resume.members?.length > 0 && (
        <Section title="Team Members">
          <div className="grid gap-4 sm:grid-cols-2">
            {resume.members.map((m, i) => (
              <div key={i} className="rounded-lg border border-[#e5e7eb] p-3">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs uppercase tracking-wider text-[#c9884a]">{m.title}</div>
                {m.bio && <p className="mt-1 text-xs leading-relaxed text-[#4a5170]">{m.bio}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.combined_skills?.length > 0 && (
        <Section title="Combined Skills">
          <div className="flex flex-wrap gap-2">
            {resume.combined_skills.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-[#f3ecdf] px-3 py-1 text-xs font-medium text-[#1a1f36]"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {resume.experience?.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {resume.experience.map((e, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>
                    {e.role} · <span className="font-normal">{e.organization}</span>
                  </span>
                  <span className="text-xs text-[#4a5170]">{e.period}</span>
                </div>
                {e.contributors?.length > 0 && (
                  <div className="text-xs text-[#c9884a]">
                    {e.contributors.join(", ")}
                  </div>
                )}
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.projects?.length > 0 && (
        <Section title="Projects">
          <div className="space-y-3">
            {resume.projects.map((p, i) => (
              <div key={i}>
                <div className="text-sm font-semibold">{p.name}</div>
                <p className="text-sm">{p.description}</p>
                {p.tech?.length > 0 && (
                  <div className="mt-1 text-xs text-[#4a5170]">
                    Tech: {p.tech.join(", ")}
                  </div>
                )}
                {p.contributors?.length > 0 && (
                  <div className="text-xs text-[#c9884a]">By {p.contributors.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.education?.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {resume.education.map((e, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{e.degree}</span> — {e.institution}
                {e.period && <span className="text-[#4a5170]"> · {e.period}</span>}
                {e.person && <span className="text-[#c9884a]"> ({e.person})</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.certifications?.length > 0 && (
        <Section title="Certifications">
          <ul className="list-disc pl-5 text-sm">
            {resume.certifications.map((c, i) => (
              <li key={i}>
                {c.name} — {c.issuer}
                {c.person && <span className="text-[#c9884a]"> ({c.person})</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-serif text-lg font-bold uppercase tracking-wider text-[#1a1f36]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ClassicTemplate({ resume }: Props) {
  return (
    <div className="mx-auto max-w-[820px] bg-white p-12 font-serif text-[#111] shadow-sm print:shadow-none">
      <header className="text-center">
        <h1 className="text-3xl font-bold uppercase tracking-widest">{resume.team_name}</h1>
        {resume.headline && (
          <p className="mt-1 text-sm italic">{resume.headline}</p>
        )}
        <div className="mt-2 text-xs">
          {[resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.website]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <hr className="mt-4 border-black" />
      </header>

      {resume.summary && (
        <div className="mt-4">
          <p className="text-sm leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {resume.members?.length > 0 && (
        <ClassicSection title="Team">
          {resume.members.map((m, i) => (
            <div key={i} className="mb-2 text-sm">
              <span className="font-bold">{m.name}</span>
              {m.title && <span className="italic"> — {m.title}</span>}
              {m.bio && <div className="text-xs">{m.bio}</div>}
            </div>
          ))}
        </ClassicSection>
      )}

      {resume.combined_skills?.length > 0 && (
        <ClassicSection title="Skills">
          <p className="text-sm">{resume.combined_skills.join(" · ")}</p>
        </ClassicSection>
      )}

      {resume.experience?.length > 0 && (
        <ClassicSection title="Experience">
          {resume.experience.map((e, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{e.role}, {e.organization}</span>
                <span className="italic">{e.period}</span>
              </div>
              {e.contributors?.length > 0 && (
                <div className="text-xs italic">Contributors: {e.contributors.join(", ")}</div>
              )}
              <ul className="mt-1 list-disc pl-5 text-sm">
                {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </ClassicSection>
      )}

      {resume.projects?.length > 0 && (
        <ClassicSection title="Projects">
          {resume.projects.map((p, i) => (
            <div key={i} className="mb-2 text-sm">
              <span className="font-bold">{p.name}.</span> {p.description}
              {p.tech?.length > 0 && <span className="italic"> ({p.tech.join(", ")})</span>}
            </div>
          ))}
        </ClassicSection>
      )}

      {resume.education?.length > 0 && (
        <ClassicSection title="Education">
          {resume.education.map((e, i) => (
            <div key={i} className="text-sm">
              <span className="font-bold">{e.degree}</span> — {e.institution}
              {e.period && <span className="italic"> ({e.period})</span>}
              {e.person && <span> — {e.person}</span>}
            </div>
          ))}
        </ClassicSection>
      )}

      {resume.certifications?.length > 0 && (
        <ClassicSection title="Certifications">
          {resume.certifications.map((c, i) => (
            <div key={i} className="text-sm">
              {c.name} — {c.issuer}
              {c.person && <span> ({c.person})</span>}
            </div>
          ))}
        </ClassicSection>
      )}
    </div>
  );
}

function ClassicSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase tracking-widest">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CompactTemplate({ resume }: Props) {
  return (
    <div className="mx-auto grid max-w-[820px] grid-cols-[240px_1fr] gap-0 bg-white font-sans text-[#1a1f36] shadow-sm print:shadow-none">
      <aside className="bg-[#1a1f36] p-8 text-white">
        <h1 className="font-serif text-2xl font-bold">{resume.team_name}</h1>
        {resume.headline && <p className="mt-2 text-sm text-[#f3ecdf]">{resume.headline}</p>}

        <div className="mt-6 space-y-1 text-xs">
          {resume.contact.email && <div>{resume.contact.email}</div>}
          {resume.contact.phone && <div>{resume.contact.phone}</div>}
          {resume.contact.location && <div>{resume.contact.location}</div>}
          {resume.contact.website && <div>{resume.contact.website}</div>}
        </div>

        {resume.combined_skills?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Skills
            </h2>
            <ul className="space-y-0.5 text-xs">
              {resume.combined_skills.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {resume.members?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Team
            </h2>
            {resume.members.map((m, i) => (
              <div key={i} className="mb-2 text-xs">
                <div className="font-semibold">{m.name}</div>
                <div className="text-[#f3ecdf]/80">{m.title}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="p-8">
        {resume.summary && (
          <section className="mb-5">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Summary
            </h2>
            <p className="text-sm leading-relaxed">{resume.summary}</p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Experience
            </h2>
            {resume.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="text-sm font-semibold">
                  {e.role} — {e.organization}
                </div>
                <div className="text-xs text-[#4a5170]">
                  {e.period}
                  {e.contributors?.length > 0 && <> · {e.contributors.join(", ")}</>}
                </div>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}

        {resume.projects?.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Projects
            </h2>
            {resume.projects.map((p, i) => (
              <div key={i} className="mb-2 text-xs">
                <span className="font-semibold">{p.name}.</span> {p.description}
                {p.tech?.length > 0 && (
                  <span className="text-[#4a5170]"> ({p.tech.join(", ")})</span>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.education?.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Education
            </h2>
            {resume.education.map((e, i) => (
              <div key={i} className="text-xs">
                <span className="font-semibold">{e.degree}</span>, {e.institution}
                {e.period && <span className="text-[#4a5170]"> · {e.period}</span>}
                {e.person && <span className="text-[#4a5170]"> · {e.person}</span>}
              </div>
            ))}
          </section>
        )}

        {resume.certifications?.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#c9884a]">
              Certifications
            </h2>
            {resume.certifications.map((c, i) => (
              <div key={i} className="text-xs">
                {c.name} — {c.issuer}
                {c.person && <span className="text-[#4a5170]"> ({c.person})</span>}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
