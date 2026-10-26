import type { ImageMetadata } from 'astro';
import type { InfoBlock, Project, ProjectMedia, SanityImage } from '../types';
import brileanCover from '../../assets/projects/brilean-cover.png';
import vault from '../../assets/projects/vault.png';
import coat from '../../assets/projects/coat.png';
import thumbO from '../../assets/projects/thumb-o.svg';
import thumbF from '../../assets/projects/thumb-f.svg';
import awardShortlist from '../../assets/projects/award-shortlist.svg';

const image = (asset: ImageMetadata, alt: string): SanityImage => ({
  url: asset.src,
  alt,
  width: asset.width,
  height: asset.height,
});

const media = (asset: ImageMetadata, alt: string): ProjectMedia => ({
  type: 'image',
  ...image(asset, alt),
});

const credits: InfoBlock = {
  type: 'rows',
  title: 'Credits',
  rows: [
    { label: 'Creative director', value: 'Rayane Cunha' },
    { label: 'Designer', value: 'Rayane Cunha' },
    { label: 'PM', value: 'Júlia Vilaça' },
    { label: 'Copywriting', value: 'João Zamith' },
    { label: '3D', value: 'Gavin Portillo\nJéssica Teixeira' },
    { label: 'Typeface in use', value: 'Lorem ipsum\nLorem ipsum' },
    { label: 'During', value: 'Onda Studio' },
  ],
};

const excerpt =
  'Lorem ipsum dolor sit amet consectetur. Turpis tempus ornare euismod consequat sagittis massa varius.';
const description = { intro: `<p>${excerpt}</p>` };

export const projects: Project[] = [
  {
    slug: 'brilean',
    title: 'Brilean',
    industry: 'Industry',
    description: {
      ...description,
      more: '<p>Habitant ut senectus nec pharetra et tortor duis arcu nulla. Adipiscing convallis gravida sit fermentum id vitae maecenas vitae vestibulum.</p><p>Praesent ullamcorper vel placerat semper sit adipiscing parturient at. Ornare augue id ullamcorper malesuada.</p>',
    },
    excerpt,
    tags: ['Branding', 'Website'],
    color: '#f1ff66',
    cover: media(brileanCover, 'Brilean chrome star symbol'),
    thumbnail: image(brileanCover, ''),
    gallery: [
      media(brileanCover, 'Brilean chrome star symbol'),
      media(brileanCover, 'Brilean chrome star symbol'),
    ],
    infoBlocks: [
      credits,
      {
        type: 'rows',
        title: 'Client',
        rows: [
          { label: 'Website', value: 'brilean.com', href: 'https://brilean.com' },
          { label: 'Client', value: 'Brilean' },
        ],
      },
      { type: 'images', title: 'Awards', images: [image(awardShortlist, 'Shortlist award badge')] },
    ],
    order: 0,
  },
  {
    slug: 'project-o',
    title: 'Project O',
    industry: 'Industry',
    description,
    excerpt,
    tags: ['Identity'],
    color: '#000000',
    cover: media(thumbO, 'Project O wordmark'),
    thumbnail: image(thumbO, ''),
    gallery: [media(thumbO, 'Project O wordmark')],
    infoBlocks: [credits],
    order: 1,
  },
  {
    slug: 'vault',
    title: 'Vault',
    industry: 'Industry',
    description,
    excerpt,
    tags: ['Branding', '3D'],
    color: '#f3809c',
    cover: media(vault, 'Vault mascot illustration'),
    thumbnail: image(vault, ''),
    gallery: [media(vault, 'Vault mascot illustration')],
    infoBlocks: [credits],
    order: 2,
  },
  {
    slug: 'project-f',
    title: 'Project F',
    industry: 'Industry',
    description,
    excerpt,
    tags: ['Website'],
    color: '#001995',
    cover: media(thumbF, 'Project F logo'),
    thumbnail: image(thumbF, ''),
    gallery: [media(thumbF, 'Project F logo')],
    infoBlocks: [credits],
    order: 3,
  },
  {
    slug: 'coat-of-arms',
    title: 'Coat of Arms',
    industry: 'Industry',
    description,
    excerpt,
    tags: ['Illustration'],
    color: '#e76a48',
    cover: media(coat, 'Illustrated coat of arms'),
    thumbnail: image(coat, ''),
    gallery: [media(coat, 'Illustrated coat of arms')],
    infoBlocks: [credits],
    order: 4,
  },
];
