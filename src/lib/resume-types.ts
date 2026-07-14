export interface TeamResume {
  team_name: string;
  headline: string;
  summary: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
  };
  members: Array<{
    name: string;
    title: string;
    bio: string;
  }>;
  combined_skills: string[];
  experience: Array<{
    role: string;
    organization: string;
    period: string;
    contributors: string[];
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    contributors: string[];
    tech: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
    person: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    person: string;
  }>;
}

export const emptyTeamResume: TeamResume = {
  team_name: "Untitled Team",
  headline: "",
  summary: "",
  contact: {},
  members: [],
  combined_skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};

export type TemplateId = "modern" | "classic" | "compact";
