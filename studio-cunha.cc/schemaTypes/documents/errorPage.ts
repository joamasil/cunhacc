import {defineField, defineType, type ValidationContext} from 'sanity'
import {ErrorScreenIcon} from '@sanity/icons/ErrorScreen'

/** Card fields are only required while the card is switched on. */
const requiredWhenShown = (value: unknown, context: ValidationContext) =>
  context.document?.showCard !== false && !value ? 'Required' : true

/** Singleton: the 404 page shown for links that don't exist. */
export const errorPage = defineType({
  name: 'errorPage',
  title: 'Error page',
  type: 'document',
  icon: ErrorScreenIcon,
  fields: [
    defineField({
      name: 'message',
      title: 'Main sentence',
      type: 'string',
      description: 'Shown in the middle of the page, e.g. "Let’s try somewhere else."',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'showCard',
      title: 'Show card',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'card',
      type: 'object',
      description: 'The card in the top-right corner. The clock under the text is added automatically.',
      options: {collapsible: false},
      hidden: ({document}) => document?.showCard === false,
      fields: [
        defineField({
          name: 'image',
          type: 'accessibleImage',
          description: 'Shown as a square. Under 500 KB.',
          validation: (rule) => rule.custom(requiredWhenShown),
        }),
        defineField({name: 'title', type: 'string', validation: (rule) => rule.custom(requiredWhenShown)}),
        defineField({name: 'text', type: 'text', rows: 2, validation: (rule) => rule.max(80)}),
        defineField({
          name: 'link',
          type: 'url',
          description: 'Where the arrow button goes. Leave empty to hide the button.',
          validation: (rule) => rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto']}),
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Error page'})},
})
