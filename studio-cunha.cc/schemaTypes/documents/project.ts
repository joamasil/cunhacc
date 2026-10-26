import {defineArrayMember, defineField, defineType} from 'sanity'
import {ProjectsIcon} from '@sanity/icons/Projects'

export const project = defineType({
  name: 'project',
  type: 'document',
  icon: ProjectsIcon,
  groups: [
    {name: 'info', title: 'Info', default: true},
    {name: 'media', title: 'Media'},
    {name: 'details', title: 'Details'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'info',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'info',
      description: 'The project URL: cunha.cc/work/<slug>',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'industry', type: 'string', group: 'info'}),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      group: 'info',
      description: 'Short synopsis shown on the project page and in link previews.',
      validation: (rule) => rule.required().max(300).warning('Keep it short — under 300 characters'),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'info',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'brandColor',
      type: 'string',
      group: 'media',
      description: 'Hex color shown behind the cover and thumbnail, e.g. #f1ff66.',
      validation: (rule) =>
        rule.required().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, {name: 'hex color'}),
    }),
    defineField({
      name: 'cover',
      type: 'projectMedia',
      group: 'media',
      description: 'Full-screen asset on the home slider.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      type: 'accessibleImage',
      group: 'media',
      description: 'Small image in the bottom project strip.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'media',
      description: 'Media column on the project page, top to bottom.',
      of: [defineArrayMember({type: 'projectMedia'})],
    }),
    defineField({
      name: 'infoBlocks',
      type: 'array',
      group: 'details',
      description: 'Credits, Client, Awards… add and reorder blocks freely.',
      of: [defineArrayMember({type: 'infoBlock'})],
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'info',
      description: 'Position on the home slider — lower comes first.',
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {title: 'Slider order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'industry', media: 'thumbnail'},
  },
})
