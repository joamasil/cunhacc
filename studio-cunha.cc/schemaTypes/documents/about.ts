import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'
import {seoFields} from '../fields/seo'

/** The detail sections under the bio, in their default order. */
const SECTIONS = [
  {title: 'Education', value: 'education'},
  {title: 'Experience', value: 'experience'},
  {title: 'Skills', value: 'skills'},
  {title: 'Software', value: 'software'},
]

/** Singleton: the About page. */
export const about = defineType({
  name: 'about',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'heading', group: 'content', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'intro', group: 'content', type: 'text', rows: 3}),
    defineField({
      group: 'content',
      name: 'bio',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}]},
        }),
      ],
    }),
    defineField({
      name: 'portrait',
      group: 'content',
      type: 'accessibleImage',
      description: 'Under 1 MB.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'content',
      name: 'resume',
      title: 'CV',
      type: 'file',
      description: 'PDF, under 5 MB.',
      options: {accept: 'application/pdf'},
    }),
    defineField({
      group: 'content',
      name: 'sectionOrder',
      title: 'Section order',
      type: 'array',
      description: 'Drag to reorder the sections below the bio. Sections with no items are hidden on the site.',
      of: [
        defineArrayMember({
          name: 'sectionKey',
          type: 'object',
          fields: [
            defineField({
              name: 'section',
              type: 'string',
              options: {list: SECTIONS, layout: 'radio'},
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {section: 'section'},
            prepare: ({section}) => ({title: SECTIONS.find((s) => s.value === section)?.title ?? section}),
          },
        }),
      ],
      initialValue: SECTIONS.map((s) => ({_type: 'sectionKey', section: s.value})),
      validation: (rule) =>
        rule.custom((items?: {section?: string}[]) => {
          const keys = (items ?? []).map((item) => item.section)
          return new Set(keys).size === keys.length || 'Each section can only appear once.'
        }),
    }),
    defineField({
      group: 'content',
      name: 'education',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'educationItem',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', description: 'e.g. Degree'}),
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'institution', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'institution'}},
        }),
      ],
    }),
    defineField({
      group: 'content',
      name: 'experience',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'experienceItem',
          type: 'object',
          fields: [
            defineField({name: 'period', type: 'string', description: 'e.g. 2023 - Current'}),
            defineField({name: 'role', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'url', title: 'URL', type: 'url'}),
          ],
          preview: {select: {title: 'role', subtitle: 'period'}},
        }),
      ],
    }),
    defineField({
      group: 'content',
      name: 'skills',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'skill',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'icons',
              type: 'array',
              description: 'Small icons shown inside the tag.',
              of: [defineArrayMember({type: 'accessibleImage', description: 'SVG, or under 50 KB.'})],
            }),
          ],
          preview: {select: {title: 'label', media: 'icons.0'}},
        }),
      ],
    }),
    defineField({
      group: 'content',
      name: 'software',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'softwareItem',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'icons',
              type: 'array',
              description: 'Small icons shown inside the tag.',
              of: [defineArrayMember({type: 'accessibleImage', description: 'SVG, or under 50 KB.'})],
            }),
          ],
          preview: {select: {title: 'label', media: 'icons.0'}},
        }),
      ],
    }),
    ...seoFields({titleHint: 'Usually "About". The site name is added after it.'}),
  ],
  preview: {prepare: () => ({title: 'About'})},
})
