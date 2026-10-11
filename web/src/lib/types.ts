export interface SanityImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  slug: string;
  title: string;
  coverImage: SanityImage;
  gallery: SanityImage[];
  description: string;
  year: number;
  role: string;
  tags: string[];
  externalLink?: string;
  order: number;
}

export interface FunItem {
  title: string;
  description: string;
  link?: string;
  date: string;
  type: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface EducationItem {
  label: string;
  title: string;
  institution: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  url?: string;
}

export interface Skill {
  label: string;
  icons: SanityImage[];
}

export interface About {
  heading: string;
  intro: string;
  bio: string;
  portrait: SanityImage;
  resumeUrl?: string;
  socialLinks: SocialLink[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: Skill[];
}

export interface SiteSettings {
  navLabels: { work: string; about: string; figma: string; pizzaHunts: string; contact: string };
  figmaUrl: string;
  contactEmail: string;
  /** IANA time zone for the live clock on the Contact card, e.g. "Europe/Lisbon". */
  timeZone: string;
  defaultSeo: { title: string; description: string; ogImage: SanityImage };
  socialLinks: SocialLink[];
}
