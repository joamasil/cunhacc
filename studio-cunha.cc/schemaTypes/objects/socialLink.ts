import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

export const socialLink = defineType({
  name: 'socialLink',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['https', 'http', 'mailto']}),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'url'}},
})
