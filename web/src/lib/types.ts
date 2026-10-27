export interface SanityImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export type ProjectMedia =
  | (SanityImage & { type: 'image' })
  | { type: 'video'; url: string; poster?: string; alt: string; width: number; height: number };

/** One item in the project page's media column: 16:9 full width, or a 1:1 square on the left or right. */
export type GalleryItem = ProjectMedia & { ratio: '16:9' | '1:1'; align: 'left' | 'right' };

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

/** Per-page SEO from the CMS. Title and description are required; the OG image falls back to the site default. */
export interface PageSeo {
  title: string;
  description: string;
  ogImage?: SanityImage;
}

export interface Project {
  slug: string;
  title: string;
  industry: string;
  /** Rich text (HTML) split at the editor's "Read more" break; `more` stays hidden until clicked. */
  description: { intro: string; more?: string };
  tags: string[];
  /** Full-screen asset on the home slider. */
  cover: ProjectMedia;
  /** Small image in the bottom project strip. */
  thumbnail: SanityImage;
  /** Media column on the project page. */
  gallery: GalleryItem[];
  infoBlocks: InfoBlock[];
  order: number;
  seo: PageSeo;
}

export interface FunItem {
  title: string;
  description: string;
  link?: string;
  date: string;
  type: string;
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
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: Skill[];
  seo: PageSeo;
}

export interface SiteSettings {
  figmaUrl: string;
  contactEmail: string;
  /** Home page SEO; its OG image is the share image for pages without their own. */
  defaultSeo: PageSeo;
}
