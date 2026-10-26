import {defineField, defineType} from 'sanity'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'

/**
 * Marker dropped into a project description: text above it shows straight
 * away, text below it sits behind "Read more" on the project page.
 */
export const readMoreBreak = defineType({
  name: 'readMoreBreak',
  title: 'Read more break',
  type: 'object',
  icon: SplitVerticalIcon,
  // Objects need at least one field; this one is never edited
  fields: [defineField({name: 'marker', type: 'boolean', hidden: true, initialValue: true})],
  preview: {prepare: () => ({title: '— Read more —'})},
})
