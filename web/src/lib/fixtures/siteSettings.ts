import type { SiteSettings } from '../types';

export const siteSettings: SiteSettings = {
  figmaUrl: 'https://www.figma.com/',
  contactEmail: 'hello@example.com',
  defaultSeo: {
    title: 'cunha.cc',
    description: 'Design & development portfolio.',
    ogImage: {
      url: 'https://placehold.co/1200x630',
      alt: 'Site preview image',
      width: 1200,
      height: 630,
    },
  },
  socialLinks: [{ label: 'Instagram', url: 'https://instagram.com' }],
};
