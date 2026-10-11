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

export interface About {
  bio: string;
  portrait: SanityImage;
  resumeUrl?: string;
  socialLinks: SocialLink[];
}

export interface SiteSettings {
  navLabels: { work: string; about: string; figma: string; pizzaHunts: string; contact: string };
  figmaUrl: string;
  defaultSeo: { title: string; description: string; ogImage: SanityImage };
  socialLinks: SocialLink[];
}
