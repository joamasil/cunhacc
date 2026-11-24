import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'
import {seoFields} from '../fields/seo'

/** Singleton: site-wide settings. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'General', default: true},
    {name: 'figma', title: 'Figma'},
    {name: 'footer', title: 'Footer'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'contactEmail',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'figmaUrl',
      title: 'Figma URL',
      type: 'url',
      group: 'figma',
      description: 'Shown as "Figma" in the menu. Leave empty to hide it.',
    }),
    defineField({
      name: 'copyright',
      type: 'string',
      group: 'footer',
      description: 'Shown after "© [current year]", which updates on its own. e.g. Rayane Cunha. All rights reserved.',
      initialValue: 'Rayane Cunha. All rights reserved.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'credits',
      type: 'array',
      group: 'footer',
      description: 'Shown on the right of the footer. To add a link, select the words and click the link icon. Leave empty to hide it.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              defineArrayMember({
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) => rule.required().uri({scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              }),
            ],
          },
        }),
      ],
      validation: (rule) => rule.max(1).error('Keep the credits to one line.'),
    }),
    // Home page SEO; the OG image is also the share image for pages without one
    ...seoFields({titleHint: 'Site name. The home page title and the suffix on every other page title.'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
