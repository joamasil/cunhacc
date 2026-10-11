import type { SiteSettings } from '../types';

export const siteSettings: SiteSettings = {
  navLabels: { home: 'Work', about: 'About', fun: 'Fun' },
  defaultSeo: {
    title: 'Joana Cunha — Portfolio',
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
