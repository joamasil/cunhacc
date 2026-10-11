import type { SiteSettings } from '../types';

export const siteSettings: SiteSettings = {
  navLabels: {
    work: 'Work',
    about: 'About',
    figma: 'Figma',
    pizzaHunts: 'Pizza hunts',
    contact: 'Contact',
  },
  figmaUrl: 'https://www.figma.com/',
  contactEmail: 'hello@example.com',
  timeZone: 'Europe/Lisbon',
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
