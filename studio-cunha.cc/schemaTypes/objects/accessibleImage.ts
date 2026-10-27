import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'

/** Image with required alt text. Every image on the site uses this. */
export const accessibleImage = defineType({
  name: 'accessibleImage',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  // Fields using this type set their own size hint; this is the fallback
  description: 'Under 2 MB.',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers. Leave empty only if purely decorative.',
      validation: (rule) => rule.required().warning('Alt text matters for accessibility and SEO'),
    }),
  ],
})
