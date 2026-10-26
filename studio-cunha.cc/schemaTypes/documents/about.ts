import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

/** Singleton — the About page. */
export const about = defineType({
  name: 'about',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'intro', type: 'text', rows: 3}),
    defineField({
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
    defineField({name: 'portrait', type: 'accessibleImage', validation: (rule) => rule.required()}),
    defineField({
      name: 'resume',
      title: 'CV (PDF)',
      type: 'file',
      options: {accept: 'application/pdf'},
    }),
    defineField({
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
              of: [defineArrayMember({type: 'accessibleImage'})],
            }),
          ],
          preview: {select: {title: 'label', media: 'icons.0'}},
        }),
      ],
    }),
    defineField({name: 'socialLinks', type: 'array', of: [defineArrayMember({type: 'socialLink'})]}),
  ],
  preview: {prepare: () => ({title: 'About'})},
})
