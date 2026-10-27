import {defineArrayMember, defineField, defineType} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {seoFields} from '../fields/seo'

export const project = defineType({
  name: 'project',
  type: 'document',
  icon: SparklesIcon,
  groups: [
    {name: 'info', title: 'Info', default: true},
    {name: 'cover', title: 'Cover'},
    {name: 'gallery', title: 'Gallery'},
    {name: 'details', title: 'Details'},
    {name: 'seo', title: 'SEO'},
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
      description: 'For the URL: cunha.cc/work/<slug>',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'industry', type: 'string', group: 'info'}),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'info',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'cover',
      type: 'projectMedia',
      group: 'cover',
      description: 'Full-screen asset on the home slider.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      type: 'accessibleImage',
      group: 'cover',
      description: 'Small image in the bottom project strip. Under 300 KB.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'gallery',
      description: 'Media column on the project page, top to bottom.',
      of: [defineArrayMember({type: 'galleryItem'})],
    }),
    defineField({
      name: 'description',
      type: 'array',
      group: 'details',
      description: 'Insert a "Read more" break to choose what shows first. The rest opens on click.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}]},
        }),
        defineArrayMember({type: 'readMoreBreak'}),
      ],
      validation: (rule) =>
        rule.required().custom((blocks: {_type: string}[] | undefined) => {
          const breaks = blocks?.filter((block) => block._type === 'readMoreBreak').length ?? 0
          if (breaks > 1) return 'Use only one "Read more" break'
          if (blocks?.[0]?._type === 'readMoreBreak') return 'Add some text before the "Read more" break'
          return true
        }),
    }),
    defineField({
      name: 'infoBlocks',
      type: 'array',
      group: 'details',
      description: 'Credits, Client, Awards… Add and reorder blocks freely.',
      of: [defineArrayMember({type: 'infoBlock'})],
    }),
    ...seoFields({titleHint: 'Usually the project title. The site name is added after it.'}),
    // Hidden rank set by dragging projects in the Studio list
    orderRankField({type: 'project'}),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: {title: 'title', subtitle: 'industry', media: 'thumbnail'},
  },
})
