import {defineArrayMember, defineField, defineType} from 'sanity'
import {ThListIcon} from '@sanity/icons/ThList'

/**
 * A titled block on a project page: either label/value rows ("Credits",
 * "Client") or a horizontal line of images such as award badges ("Awards").
 */
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
      name: 'kind',
      title: 'Format',
      type: 'string',
      options: {
        list: [
          {title: 'Rows', value: 'rows'},
          {title: 'Images', value: 'images'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'rows',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rows',
      type: 'array',
      hidden: ({parent}) => parent?.kind === 'images',
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
    defineField({
      name: 'images',
      type: 'array',
      description: 'Shown side by side, in this order. SVGs work best for logos and badges.',
      hidden: ({parent}) => parent?.kind !== 'images',
      of: [defineArrayMember({type: 'accessibleImage'})],
      options: {layout: 'grid'},
    }),
  ],
  preview: {
    select: {title: 'title', kind: 'kind', rows: 'rows', images: 'images'},
    prepare: ({title, kind, rows, images}) => ({
      title,
      subtitle:
        kind === 'images' ? `${images?.length ?? 0} images` : `${rows?.length ?? 0} rows`,
      media: kind === 'images' ? images?.[0] : undefined,
    }),
  },
})
