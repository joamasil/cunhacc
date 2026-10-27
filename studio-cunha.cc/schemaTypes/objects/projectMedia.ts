import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

type MediaParent = {kind?: string}

/**
 * Image, video and poster fields shared by the cover and gallery items, with
 * size hints for where they show. Videos are uploaded as plain files: Sanity
 * serves them as-is (no streaming or transcoding), so keep them short,
 * compressed loops.
 */
export const mediaFields = ({imageSize, videoSize}: {imageSize: string; videoSize: string}) => [
  defineField({
    name: 'image',
    type: 'accessibleImage',
    description: imageSize,
    hidden: ({parent}) => parent?.kind !== 'image',
    validation: (rule) =>
      rule.custom((value, {parent}) =>
        (parent as MediaParent)?.kind === 'image' && !value ? 'Add an image' : true,
      ),
  }),
  defineField({
    name: 'video',
    type: 'file',
    description: `MP4 or WebM. ${videoSize}`,
    options: {accept: 'video/mp4,video/webm'},
    hidden: ({parent}) => parent?.kind !== 'video',
    validation: (rule) =>
      rule.custom((value, {parent}) =>
        (parent as MediaParent)?.kind === 'video' && !value?.asset ? 'Upload a video' : true,
      ),
  }),
  defineField({
    name: 'poster',
    type: 'accessibleImage',
    description: 'Shown while the video loads, under 1 MB. Its alt text describes the video.',
    hidden: ({parent}) => parent?.kind !== 'video',
    validation: (rule) =>
      rule.custom((value, {parent}) =>
        (parent as MediaParent)?.kind === 'video' && !value ? 'Add a poster image' : true,
      ),
  }),
]

/** A project's cover image or video (gallery items extend it, see galleryItem). */
export const projectMedia = defineType({
  name: 'projectMedia',
  title: 'Cover media',
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
    // Full screen, so larger than the gallery
    ...mediaFields({
      imageSize: 'Under 2 MB.',
      videoSize: 'Under 8 MB.',
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
