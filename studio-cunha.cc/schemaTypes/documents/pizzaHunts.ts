import {defineArrayMember, defineField, defineType} from 'sanity'
import {PizzaIcon} from '../icons/PizzaIcon'
import {PinIcon} from '@sanity/icons/Pin'
import {seoFields} from '../fields/seo'

/** Singleton: the Pizza hunts page — a title and the list of pizza places. */
export const pizzaHunts = defineType({
  name: 'pizzaHunts',
  title: 'Pizza hunts',
  type: 'document',
  icon: PizzaIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'showInMenu',
      title: 'Show in menu',
      type: 'boolean',
      group: 'content',
      description: 'Turn off to hide "Pizza hunts" from the menu. The page still works at /pizza-hunts.',
      initialValue: true,
    }),
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      description: 'Text in (brackets) shows in grey. e.g. (My) to-Dough List ↘',
      initialValue: '(My) to-Dough List ↘',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'places',
      title: 'Pizza places',
      type: 'array',
      group: 'content',
      description: 'Drag to set the order. Visitors can also sort by pizzeria, city or country.',
      of: [
        defineArrayMember({
          name: 'pizzaPlace',
          title: 'Pizza place',
          type: 'object',
          icon: PinIcon,
          fields: [
            defineField({name: 'name', title: 'Pizzeria', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'city', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'country', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'countryCode',
              title: 'Country code',
              type: 'string',
              description: 'Shown instead of the country on mobile, e.g. PT. Leave empty to show the full name.',
              validation: (rule) => rule.max(3).warning('Keep it short, e.g. PT'),
            }),
            defineField({
              name: 'directionsUrl',
              title: 'Directions link',
              type: 'url',
              description: 'Opens from "Go to", e.g. a Google Maps link. Leave empty to hide "Go to".',
            }),
            defineField({
              name: 'details',
              type: 'array',
              description:
                'Shown when the row is opened, in this order: e.g. the full address, Phone, Instagram or Email. Leave empty and the row doesn’t open.',
              of: [
                defineArrayMember({
                  name: 'placeDetail',
                  title: 'Detail',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      type: 'string',
                      description: 'Optional, shown before the value. e.g. Phone, Email. Leave empty for the address.',
                    }),
                    defineField({
                      name: 'value',
                      type: 'text',
                      rows: 3,
                      description: 'Line breaks show as separate lines.',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Link',
                      type: 'url',
                      description: 'Optional. Makes the value a link (underlined). https://…, mailto:… or tel:…',
                      validation: (rule) => rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
                    }),
                  ],
                  preview: {
                    select: {label: 'label', value: 'value'},
                    prepare: ({label, value}) => ({title: label || value, subtitle: label ? value : undefined}),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'name', city: 'city', country: 'country'},
            prepare: ({title, city, country}) => ({title, subtitle: [city, country].filter(Boolean).join(', ')}),
          },
        }),
      ],
    }),
    ...seoFields({titleHint: 'e.g. Pizza hunts.'}),
  ],
  preview: {prepare: () => ({title: 'Pizza hunts'})},
})
