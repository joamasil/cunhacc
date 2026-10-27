import { sanityClient } from 'sanity:client';
import { defineQuery } from 'groq';
import { toHTML } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/image-url';
import { urlFor } from './sanity/image';
import type { About, GalleryItem, InfoBlock, PageSeo, Project, ProjectMedia, SanityImage, SiteSettings } from './types';

/*
 * Published content only: the client's API version defaults to the "published"
 * perspective, so drafts never reach the site. Pages are static, so a Netlify
 * rebuild (triggered by the Sanity webhook) is what makes a publish go live.
 */

// Image projection: the asset ref, crop and hotspot for the URL builder, plus
// the original size for width/height attributes
const IMAGE = `{ ..., "dimensions": asset->metadata.dimensions }`;
const MEDIA_FIELDS = `kind, image${IMAGE}, poster${IMAGE}, "videoUrl": video.asset->url`;
const MEDIA = `{ ${MEDIA_FIELDS} }`;
const SEO = `"seo": { "title": metaTitle, "description": metaDescription, ogImage${IMAGE} }`;

const PROJECTS_QUERY = defineQuery(`*[_type == "project" && defined(slug.current)] | order(orderRank) {
  "slug": slug.current,
  title,
  industry,
  description,
  tags,
  cover${MEDIA},
  thumbnail${IMAGE},
  gallery[]{ ratio, align, ${MEDIA_FIELDS} },
  infoBlocks[]{ kind, title, rows[]{ label, value, href }, images[]${IMAGE} },
  ${SEO}
}`);

const ABOUT_QUERY = defineQuery(`*[_type == "about" && _id == "about"][0] {
  heading,
  intro,
  bio,
  portrait${IMAGE},
  "resumeUrl": resume.asset->url,
  education[]{ label, title, institution },
  experience[]{ period, role, url },
  skills[]{ label, icons[]${IMAGE} },
  ${SEO}
}`);

const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
  figmaUrl,
  contactEmail,
  ${SEO}
}`);

type RawImage = SanityImageSource & { alt?: string; dimensions?: { width: number; height: number } };

interface RawMedia {
  kind: 'image' | 'video' | 'lottie';
  image?: RawImage;
  poster?: RawImage;
  videoUrl?: string;
}

interface RawSeo {
  title: string;
  description: string;
  ogImage?: RawImage;
}

type RawBlock = PortableTextBlock | { _type: 'readMoreBreak'; _key: string };

interface RawProject {
  slug: string;
  title: string;
  industry: string | null;
  description: RawBlock[] | null;
  tags: string[] | null;
  cover: RawMedia;
  thumbnail: RawImage;
  gallery: (RawMedia & { ratio: GalleryItem['ratio'] | null; align: GalleryItem['align'] | null })[] | null;
  infoBlocks:
    | {
        kind: 'rows' | 'images';
        title: string;
        rows: { label: string; value: string; href?: string }[] | null;
        images: RawImage[] | null;
      }[]
    | null;
  seo: RawSeo;
}

interface RawAbout {
  heading: string;
  intro: string | null;
  bio: PortableTextBlock[] | null;
  portrait: RawImage;
  resumeUrl: string | null;
  education: About['education'] | null;
  experience: About['experience'] | null;
  skills: { label: string; icons: RawImage[] | null }[] | null;
  seo: RawSeo;
}

interface RawSiteSettings {
  figmaUrl: string | null;
  contactEmail: string;
  seo: RawSeo;
}

/** Image URL at `width` px wide (never upscaled), keeping the original aspect ratio. */
function mapImage(image: RawImage, width: number): SanityImage {
  const original = image.dimensions ?? { width, height: width };
  const w = Math.min(width, original.width);
  return {
    url: urlFor(image).width(w).fit('max').url(),
    alt: image.alt ?? '',
    width: w,
    height: Math.round((w * original.height) / original.width),
  };
}

/** Image or video; Lottie items return null (not rendered on the site yet). */
function mapMedia(media: RawMedia, width: number): ProjectMedia | null {
  if (media.kind === 'video' && media.videoUrl && media.poster) {
    const poster = mapImage(media.poster, width);
    return { type: 'video', url: media.videoUrl, poster: poster.url, alt: poster.alt, width: poster.width, height: poster.height };
  }
  if (media.kind === 'image' && media.image) return { type: 'image', ...mapImage(media.image, width) };
  return null;
}

function mapSeo(seo: RawSeo): PageSeo {
  return {
    title: seo.title,
    description: seo.description,
    ogImage: seo.ogImage && { ...mapImage(seo.ogImage, 1200), url: urlFor(seo.ogImage).width(1200).height(630).url() },
  };
}

/** Splits the description at its "Read more" break: `intro` shows straight away, `more` opens on click. */
function mapDescription(blocks: RawBlock[]): Project['description'] {
  const index = blocks.findIndex((block) => block._type === 'readMoreBreak');
  const intro = (index === -1 ? blocks : blocks.slice(0, index)) as PortableTextBlock[];
  const more = (index === -1 ? [] : blocks.slice(index + 1)) as PortableTextBlock[];
  return { intro: toHTML(intro), more: more.length > 0 ? toHTML(more) : undefined };
}

function mapProject(raw: RawProject, order: number): Project {
  const cover = mapMedia(raw.cover, 2560);
  if (!cover) throw new Error(`Project "${raw.title}" has no cover. Add one in Sanity and publish.`);
  return {
    slug: raw.slug,
    title: raw.title,
    industry: raw.industry ?? '',
    description: mapDescription(raw.description ?? []),
    tags: raw.tags ?? [],
    cover,
    thumbnail: mapImage(raw.thumbnail, 600),
    gallery: (raw.gallery ?? []).flatMap((item): GalleryItem[] => {
      const media = mapMedia(item, 1920);
      if (!media) return [];
      const ratio = item.ratio ?? '16:9';
      // Squares are cropped by the CDN around the editor's hotspot
      if (ratio === '1:1' && media.type === 'image' && item.image) {
        const side = Math.min(1080, media.width, media.height);
        Object.assign(media, { url: urlFor(item.image).width(side).height(side).url(), width: side, height: side });
      }
      return [{ ...media, ratio, align: item.align ?? 'left' }];
    }),
    infoBlocks: (raw.infoBlocks ?? []).map(
      (block): InfoBlock =>
        block.kind === 'images'
          ? { type: 'images', title: block.title, images: (block.images ?? []).map((image) => mapImage(image, 400)) }
          : { type: 'rows', title: block.title, rows: block.rows ?? [] },
    ),
    order,
    seo: mapSeo(raw.seo),
  };
}

export async function getProjects(): Promise<Project[]> {
  const raw = await sanityClient.fetch<RawProject[]>(PROJECTS_QUERY);
  return raw.map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((project) => project.slug === slug) ?? null;
}

export async function getAbout(): Promise<About> {
  const raw = await sanityClient.fetch<RawAbout | null>(ABOUT_QUERY);
  if (!raw) throw new Error('The About page is not published in Sanity yet.');
  return {
    heading: raw.heading,
    intro: raw.intro ?? '',
    bio: toHTML(raw.bio ?? []),
    portrait: mapImage(raw.portrait, 1200),
    resumeUrl: raw.resumeUrl ?? undefined,
    education: raw.education ?? [],
    experience: raw.experience ?? [],
    skills: (raw.skills ?? []).map((skill) => ({
      label: skill.label,
      icons: (skill.icons ?? []).map((icon) => mapImage(icon, 64)),
    })),
    seo: mapSeo(raw.seo),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await sanityClient.fetch<RawSiteSettings | null>(SITE_SETTINGS_QUERY);
  if (!raw) throw new Error('Site settings are not published in Sanity yet.');
  return {
    figmaUrl: raw.figmaUrl ?? '',
    contactEmail: raw.contactEmail,
    defaultSeo: mapSeo(raw.seo),
  };
}
