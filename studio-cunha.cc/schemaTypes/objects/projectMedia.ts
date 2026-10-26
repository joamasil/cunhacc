import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

/**
 * One image or video on a project (the home slider cover or a gallery item).
 * Videos are linked by URL rather than uploaded: Sanity file assets aren't
 * streamed or transcoded, so large video files are slow and costly to serve.
 */
export const projectMedia = defineType({
  name: 'projectMedia',
  title: 'Media',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'accessibleImage',
      hidden: ({parent}) => parent?.kind !== 'image',
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          (parent as {kind?: string})?.kind === 'image' && !value ? 'Add an image' : true,
        ),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Direct link to an .mp4/.webm file on a video host.',
      hidden: ({parent}) => parent?.kind !== 'video',
      validation: (rule) =>
        rule
          .uri({scheme: ['https']})
          .custom((value, {parent}) =>
            (parent as {kind?: string})?.kind === 'video' && !value ? 'Add a video URL' : true,
          ),
    }),
    defineField({
      name: 'poster',
      type: 'accessibleImage',
      description: 'Shown while the video loads. Its alt text describes the video.',
      hidden: ({parent}) => parent?.kind !== 'video',
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          (parent as {kind?: string})?.kind === 'video' && !value ? 'Add a poster image' : true,
        ),
    }),
    defineField({
      name: 'fit',
      type: 'string',
      description: 'Fill the frame edge to edge, or show the whole asset centered.',
      options: {
        list: [
          {title: 'Fill', value: 'cover'},
          {title: 'Fit whole', value: 'contain'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'cover',
    }),
  ],
  preview: {
    select: {kind: 'kind', image: 'image', poster: 'poster', alt: 'image.alt', posterAlt: 'poster.alt'},
    prepare: ({kind, image, poster, alt, posterAlt}) => ({
      title: (kind === 'video' ? posterAlt : alt) || 'Untitled media',
      subtitle: kind === 'video' ? 'Video' : 'Image',
      media: kind === 'video' ? poster : image,
    }),
  },
})
