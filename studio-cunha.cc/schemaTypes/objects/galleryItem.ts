import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {projectMedia} from './projectMedia'

type GalleryParent = {kind?: string; ratio?: string}

/**
 * One item in a project's gallery column: image, video or Lottie, shown one
 * per row at 16:9 or 1:1. Square items sit to the left or right of the row.
 */
export const galleryItem = defineType({
  name: 'galleryItem',
  title: 'Gallery item',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'ratio',
      type: 'string',
      options: {
        list: [
          {title: '16:9', value: '16:9'},
          {title: '1:1', value: '1:1'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '16:9',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      description: 'Which side of the row the square sits on.',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      hidden: ({parent}) => parent?.ratio !== '1:1',
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'Lottie', value: 'lottie'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
    }),
    // Image, video and poster fields are shared with the cover
    ...projectMedia.fields.filter((field) => field.name !== 'kind'),
    defineField({
      name: 'lottie',
      type: 'file',
      description: 'Lottie animation exported as .json.',
      options: {accept: 'application/json,.json'},
      hidden: ({parent}) => parent?.kind !== 'lottie',
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          (parent as GalleryParent)?.kind === 'lottie' && !value?.asset ? 'Upload a Lottie file' : true,
        ),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describe the animation for screen readers.',
      hidden: ({parent}) => parent?.kind !== 'lottie',
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          (parent as GalleryParent)?.kind === 'lottie' && !value
            ? 'Alt text matters for accessibility and SEO'
            : true,
        ).warning(),
    }),
  ],
  preview: {
    select: {
      kind: 'kind',
      ratio: 'ratio',
      align: 'align',
      image: 'image',
      poster: 'poster',
      imageAlt: 'image.alt',
      posterAlt: 'poster.alt',
      lottieAlt: 'alt',
    },
    prepare: ({kind, ratio, align, image, poster, imageAlt, posterAlt, lottieAlt}) => {
      const title = {image: imageAlt, video: posterAlt, lottie: lottieAlt}[kind as string]
      const label = {image: 'Image', video: 'Video', lottie: 'Lottie'}[kind as string] ?? 'Media'
      return {
        title: title || 'Untitled media',
        subtitle: [label, ratio, ratio === '1:1' && align].filter(Boolean).join(' · '),
        media: kind === 'video' ? poster : kind === 'image' ? image : ImagesIcon,
      }
    },
  },
})
