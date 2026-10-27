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
    {name: 'navigation', title: 'Navigation'},
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
      group: 'navigation',
    }),
    // Home page SEO; the OG image is also the share image for pages without one
    ...seoFields({titleHint: 'Site name. The home page title and the suffix on every other page title.'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
