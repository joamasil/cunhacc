export interface SanityImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** How a media item fills its frame: edge to edge, or whole and centered. */
export type MediaFit = 'cover' | 'contain';

export type ProjectMedia =
  | (SanityImage & { type: 'image'; fit?: MediaFit })
  | { type: 'video'; url: string; poster?: string; alt: string; width: number; height: number; fit?: MediaFit };

export interface InfoRow {
  label: string;
  /** Line breaks ("\n") render as separate lines. */
  value: string;
  href?: string;
}

/** A titled list of rows on the project page — "Credits", "Client", etc. */
export interface InfoBlock {
  title: string;
  rows: InfoRow[];
}

export interface Project {
  slug: string;
  title: string;
  industry: string;
  description: string;
  tags: string[];
  /** Brand color shown behind the cover and thumbnail. */
  color: string;
  /** Full-screen asset on the home slider. */
  cover: ProjectMedia;
  /** Small image in the bottom project strip. */
  thumbnail: SanityImage;
  /** Media column on the project page. */
  gallery: ProjectMedia[];
  infoBlocks: InfoBlock[];
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
