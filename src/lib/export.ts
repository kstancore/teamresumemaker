import type { TeamResume } from "./resume-types";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export async function downloadPdf(resume: TeamResume, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeHeading = (text: string, size = 18) => {
    ensureSpace(size + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.text(text, margin, y);
    y += size + 6;
  };

  const writeText = (text: string, size = 10, bold = false) => {
    if (!text) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 3;
    }
  };

  const spacer = (px = 6) => (y += px);

  writeHeading(resume.team_name || "Team Resume", 22);
  if (resume.headline) writeText(resume.headline, 12, true);
  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.website,
  ]
    .filter(Boolean)
    .join(" · ");
  if (contact) writeText(contact, 9);
  spacer(8);

  if (resume.summary) {
    writeHeading("Team Summary", 12);
    writeText(resume.summary);
    spacer();
  }

  if (resume.members?.length) {
    writeHeading("Team Members", 12);
    for (const m of resume.members) {
      writeText(`${m.name} — ${m.title}`, 10, true);
      if (m.bio) writeText(m.bio);
    }
    spacer();
  }

  if (resume.combined_skills?.length) {
    writeHeading("Skills", 12);
    writeText(resume.combined_skills.join(" · "));
    spacer();
  }

  if (resume.experience?.length) {
    writeHeading("Experience", 12);
    for (const e of resume.experience) {
      writeText(`${e.role} — ${e.organization}   (${e.period})`, 10, true);
      if (e.contributors?.length) writeText(`Contributors: ${e.contributors.join(", ")}`, 9);
      for (const b of e.bullets ?? []) writeText(`• ${b}`);
      spacer(4);
    }
  }

  if (resume.projects?.length) {
    writeHeading("Projects", 12);
    for (const p of resume.projects) {
      writeText(`${p.name}`, 10, true);
      writeText(p.description);
      if (p.tech?.length) writeText(`Tech: ${p.tech.join(", ")}`, 9);
      if (p.contributors?.length) writeText(`By ${p.contributors.join(", ")}`, 9);
      spacer(4);
    }
  }

  if (resume.education?.length) {
    writeHeading("Education", 12);
    for (const e of resume.education) {
      writeText(`${e.degree} — ${e.institution} ${e.period ? `(${e.period})` : ""} ${e.person ? `· ${e.person}` : ""}`);
    }
    spacer();
  }

  if (resume.certifications?.length) {
    writeHeading("Certifications", 12);
    for (const c of resume.certifications) {
      writeText(`${c.name} — ${c.issuer}${c.person ? ` (${c.person})` : ""}`);
    }
  }

  doc.save(filename);
}

export async function downloadDocx(resume: TeamResume, filename: string) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: resume.team_name || "Team Resume",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
    }),
  );
  if (resume.headline) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: resume.headline, italics: true })] }),
    );
  }
  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.website,
  ]
    .filter(Boolean)
    .join(" · ");
  if (contact) children.push(new Paragraph({ text: contact }));

  const heading = (t: string) =>
    children.push(new Paragraph({ text: t, heading: HeadingLevel.HEADING_2 }));

  if (resume.summary) {
    heading("Team Summary");
    children.push(new Paragraph({ text: resume.summary }));
  }

  if (resume.members?.length) {
    heading("Team Members");
    for (const m of resume.members) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${m.name} — ${m.title}`, bold: true }),
          ],
        }),
      );
      if (m.bio) children.push(new Paragraph({ text: m.bio }));
    }
  }

  if (resume.combined_skills?.length) {
    heading("Skills");
    children.push(new Paragraph({ text: resume.combined_skills.join(" · ") }));
  }

  if (resume.experience?.length) {
    heading("Experience");
    for (const e of resume.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.role} — ${e.organization}`, bold: true }),
            new TextRun({ text: `   (${e.period})`, italics: true }),
          ],
        }),
      );
      if (e.contributors?.length) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Contributors: ${e.contributors.join(", ")}`, italics: true })],
          }),
        );
      }
      for (const b of e.bullets ?? []) {
        children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      }
    }
  }

  if (resume.projects?.length) {
    heading("Projects");
    for (const p of resume.projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p.name, bold: true }), new TextRun({ text: `. ${p.description}` })],
        }),
      );
      if (p.tech?.length) children.push(new Paragraph({ text: `Tech: ${p.tech.join(", ")}` }));
      if (p.contributors?.length)
        children.push(new Paragraph({ text: `By ${p.contributors.join(", ")}` }));
    }
  }

  if (resume.education?.length) {
    heading("Education");
    for (const e of resume.education) {
      children.push(
        new Paragraph({
          text: `${e.degree} — ${e.institution}${e.period ? ` (${e.period})` : ""}${e.person ? ` · ${e.person}` : ""}`,
        }),
      );
    }
  }

  if (resume.certifications?.length) {
    heading("Certifications");
    for (const c of resume.certifications) {
      children.push(
        new Paragraph({ text: `${c.name} — ${c.issuer}${c.person ? ` (${c.person})` : ""}` }),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
