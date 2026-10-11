import type { Project } from '../types';

export const projects: Project[] = [
  {
    slug: 'first-project',
    title: 'First Project',
    coverImage: {
      url: 'https://placehold.co/1200x800',
      alt: 'Cover image for First Project',
      width: 1200,
      height: 800,
    },
    gallery: [],
    description: 'A short description of the first project.',
    year: 2024,
    role: 'Design & Development',
    tags: ['branding', 'web'],
    order: 0,
  },
  {
    slug: 'second-project',
    title: 'Second Project',
    coverImage: {
      url: 'https://placehold.co/1200x800',
      alt: 'Cover image for Second Project',
      width: 1200,
      height: 800,
    },
    gallery: [],
    description: 'A short description of the second project.',
    year: 2023,
    role: 'Art Direction',
    tags: ['identity'],
    order: 1,
  },
];
