import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

/** Singleton — site-wide settings. */
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
      name: 'timeZone',
      type: 'string',
      group: 'general',
      description: 'IANA time zone for the live clock on the Contact card, e.g. Europe/Lisbon.',
      initialValue: 'Europe/Lisbon',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'figmaUrl',
      title: 'Figma URL',
      type: 'url',
      group: 'navigation',
    }),
    defineField({
      name: 'navLabels',
      title: 'Navigation labels',
      type: 'object',
      group: 'navigation',
      fields: ['work', 'about', 'figma', 'pizzaHunts', 'contact'].map((name) =>
        defineField({name, type: 'string', validation: (rule) => rule.required()}),
      ),
    }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      group: 'general',
      of: [defineArrayMember({type: 'socialLink'})],
    }),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          description: 'Site name — also the suffix on every page title.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'description',
          type: 'text',
          rows: 2,
          validation: (rule) => rule.required().max(160).warning('Search results cut off around 160 characters'),
        }),
        defineField({name: 'ogImage', title: 'Share image', type: 'accessibleImage'}),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
