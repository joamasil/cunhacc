import type { About } from '../types';

export const about: About = {
  bio: "<p>Hi, I'm Joana — a designer/developer building things on the internet.</p>",
  portrait: {
    url: 'https://placehold.co/800x1000',
    alt: 'Portrait photo',
    width: 800,
    height: 1000,
  },
  resumeUrl: undefined,
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com' },
    { label: 'Email', url: 'mailto:hello@example.com' },
  ],
};
