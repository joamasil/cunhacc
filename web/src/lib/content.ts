import type { About, FunItem, Project, SiteSettings } from './types';
import { projects } from './fixtures/projects';
import { about } from './fixtures/about';
import { funItems } from './fixtures/funItems';
import { siteSettings } from './fixtures/siteSettings';

export async function getProjects(): Promise<Project[]> {
  return [...projects].sort((a, b) => a.order - b.order);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((project) => project.slug === slug) ?? null;
}

export async function getFunItems(): Promise<FunItem[]> {
  return funItems;
}

export async function getAbout(): Promise<About> {
  return about;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings;
}
