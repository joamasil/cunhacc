export interface SanityImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export type ProjectMedia =
  | (SanityImage & { type: 'image' })
  | { type: 'video'; url: string; poster?: string; alt: string; width: number; height: number };

export interface InfoRow {
  label: string;
  /** Line breaks ("\n") render as separate lines. */
  value: string;
  href?: string;
}

/** A titled block on the project page: label/value rows ("Credits") or a line of images ("Awards"). */
export type InfoBlock =
  | { type: 'rows'; title: string; rows: InfoRow[] }
  | { type: 'images'; title: string; images: SanityImage[] };

/** Per-page SEO overrides from the CMS; empty fields fall back to page content or the site defaults. */
export interface PageSeo {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
}

export interface Project {
  slug: string;
  title: string;
  industry: string;
  /** Rich text (HTML) split at the editor's "Read more" break; `more` stays hidden until clicked. */
  description: { intro: string; more?: string };
  /** Plain text of `description.intro` — the fallback meta description. */
  excerpt: string;
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
  seo?: PageSeo;
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
  seo?: PageSeo;
}

export interface SiteSettings {
  figmaUrl: string;
  contactEmail: string;
  defaultSeo: { title: string; description: string; ogImage: SanityImage };
  socialLinks: SocialLink[];
}
