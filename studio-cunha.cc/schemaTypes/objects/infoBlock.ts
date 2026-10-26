import {defineArrayMember, defineField, defineType} from 'sanity'
import {ThListIcon} from '@sanity/icons/ThList'

/** A titled list of label/value rows on a project page — "Credits", "Client", etc. */
export const infoBlock = defineType({
  name: 'infoBlock',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'e.g. Credits, Client, Awards',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'infoRow',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'value',
              type: 'text',
              rows: 2,
              description: 'Each line shows on its own line.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'url',
              description: 'Optional — makes the value a link.',
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', rows: 'rows'},
    prepare: ({title, rows}) => ({
      title,
      subtitle: `${rows?.length ?? 0} rows`,
    }),
  },
})
