import {defineField, defineType} from 'sanity'
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
      name: 'builtByLabel',
      title: 'Built by: name',
      type: 'string',
      group: 'footer',
      description: 'Shown as "Built by [name]". Leave empty to hide it.',
      initialValue: 'joana.dev',
    }),
    defineField({
      name: 'builtByUrl',
      title: 'Built by: link',
      type: 'url',
      group: 'footer',
      description: 'Optional. Makes the name a link.',
      initialValue: 'https://joana.dev',
      hidden: ({parent}) => !parent?.builtByLabel,
    }),
    // Home page SEO; the OG image is also the share image for pages without one
    ...seoFields({titleHint: 'Site name. The home page title and the suffix on every other page title.'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
