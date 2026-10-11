import type { About } from '../types';
import portrait from '../../assets/about/portrait.jpg?url';
import figmaIcon from '../../assets/icons/skill-figma.svg?url';
import asteriskIcon from '../../assets/icons/skill-asterisk.svg?url';
import aeIcon from '../../assets/icons/skill-ae.svg?url';

export const about: About = {
  heading: 'Hi, my name is Rayane.',
  intro: 'But you can call me “Ray”. In portuguese, it’s pronounced “hī,” like “hi”. So, you can say “Hi, Hi!”',
  bio: '<p>Lorem ipsum dolor sit amet consectetur. Habitant ut senectus nec pharetra et tortor duis arcu nulla. Adipiscing convallis gravida sit fermentum id vitae maecenas vitae vestibulum. Praesent ullamcorper vel placerat semper sit adipiscing parturient at. Ornare augue id ullamcorper malesuada. In ut vulputate felis vel.</p>',
  portrait: {
    url: portrait,
    alt: 'Rayane wearing a yellow Teletubby costume',
    width: 800,
    height: 799,
  },
  resumeUrl: 'https://example.com/cv.pdf',
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com' },
    { label: 'Email', url: 'mailto:hello@example.com' },
  ],
  education: [
    {
      label: 'Degree',
      title: 'Bachelor’s degree in Communication Design',
      institution: 'Faculty of Fine Arts of University of Porto',
    },
  ],
  experience: [
    { period: '2023 - Current', role: 'Designer at Onda Studio', url: 'https://ondastudio.co' },
    { period: '2021 - 2023', role: 'Intership at ESTUDIO CRU', url: 'https://example.com' },
    { period: '2021 - 2021', role: 'Designer at FBAUP Design INC.' },
  ],
  skills: [
    {
      label: 'Digital Design',
      icons: [
        { url: figmaIcon, alt: 'Figma', width: 8, height: 12 },
        { url: asteriskIcon, alt: '', width: 12, height: 12 },
      ],
    },
    { label: 'Branding', icons: [] },
    { label: 'Motion', icons: [{ url: aeIcon, alt: 'After Effects', width: 12, height: 12 }] },
    { label: 'Illustration', icons: [] },
  ],
};
