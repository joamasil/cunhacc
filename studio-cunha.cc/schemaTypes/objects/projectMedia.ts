import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

/**
 * A project's cover image or video (gallery items extend it, see galleryItem).
 * Videos are uploaded as plain files: Sanity serves them as-is (no streaming
 * or transcoding), so keep them short, compressed loops.
 */
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
      name: 'video',
      type: 'file',
      description: 'MP4 or WebM, compressed — ideally under 5 MB.',
      options: {accept: 'video/mp4,video/webm'},
      hidden: ({parent}) => parent?.kind !== 'video',
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          (parent as {kind?: string})?.kind === 'video' && !value?.asset ? 'Upload a video' : true,
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
