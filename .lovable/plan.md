
# Team Resume Maker — Build Plan

An AI-powered web app that merges 2+ individual resumes (PDF/DOCX uploads) into a single unified team resume, with a workspace to edit, restyle across templates, and download as PDF or DOCX.

## Core Flows

1. **Auth** — Email/password + Google sign-in (via Lovable Cloud).
2. **Workspace** — After login, users see their list of "Team Resume" projects. Create new, open, rename, delete.
3. **Inside a project**:
   - Upload 2+ resume files (PDF/DOCX).
   - Click "Generate Team Resume" → AI parses each file and merges into one structured team resume.
   - View the result rendered in a live template.
   - Edit any field inline (name, roles, skills, experience bullets, projects, education).
   - Switch between 3 templates (Modern, Classic, Compact) — swap styling without losing content.
   - Download as PDF or DOCX.

## Pages / Routes

- `/` — Landing page (hero, features, CTA to sign in).
- `/auth` — Sign in / sign up (email+password and Google).
- `/_authenticated/workspace` — List of projects + "New project" button.
- `/_authenticated/workspace/$projectId` — Editor: upload panel, generate button, resume preview canvas, template switcher, download buttons.

## Data Model (Lovable Cloud)

- `projects` — id, user_id, name, merged_resume_json, template, created_at, updated_at.
- `resume_files` — id, project_id, user_id, storage_path, original_filename, parsed_text, created_at.
- Storage bucket `resumes` (private) for uploaded PDFs/DOCX.
- RLS: each user can only read/write their own rows and files.

## AI Merge Logic

Server function that:
1. Loads all uploaded files' extracted text for the project.
2. Sends to `google/gemini-3-flash-preview` via Lovable AI Gateway.
3. Uses structured output to return a normalized team resume JSON:
   - `team_name`, `summary`, `members[]` (name, title, bio), `combined_skills[]`, `experience[]`, `projects[]`, `education[]`, `contact`.
4. Saves JSON back to the project row.

Text extraction: PDF via `pdfjs-dist` / DOCX via `mammoth`, done server-side inside the server function.

## Templates

3 React components rendering the same merged JSON differently:
- **Modern** — bold accent color, two-column, icons.
- **Classic** — serif, single column, traditional.
- **Compact** — dense, sidebar for skills.

Template choice stored per project. Switch is instant.

## Editing

Each section of the rendered resume is inline-editable (contentEditable + controlled form fields in a side panel). Debounced autosave to the project's JSON.

## Download

- **PDF** — client-side via `html2pdf.js` (or `@react-pdf/renderer` for cleaner output) rendering the current template.
- **DOCX** — client-side via `docx` library building a doc from the JSON.

## Design Direction

Clean, professional, slightly editorial feel — dark navy + warm accent (amber/gold), Inter for UI, Fraunces for headings. Card-based workspace, spacious editor.

## Technical Notes

- TanStack Start (existing stack).
- Lovable Cloud for auth, DB, storage.
- Lovable AI Gateway (`LOVABLE_API_KEY`) for merging — no user-supplied API keys needed.
- File uploads to Supabase Storage; parsing + AI in server functions with `requireSupabaseAuth`.
- Server functions in `src/lib/*.functions.ts`; parsing helpers in `*.server.ts`.

## Build Order

1. Enable Lovable Cloud + configure Google auth.
2. DB schema (projects, resume_files) + storage bucket + RLS.
3. Auth page and protected `_authenticated` layout.
4. Workspace list page (create/list/delete projects).
5. Project editor: upload UI + file storage.
6. Server function: extract text + AI merge → save JSON.
7. Template renderer components (3 templates) + switcher.
8. Inline editing + autosave.
9. PDF and DOCX export.
10. Landing page + polish.

Ready to build on approval.
