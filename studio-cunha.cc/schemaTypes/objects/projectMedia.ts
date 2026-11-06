import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

type MediaParent = {kind?: string}

/**
 * Image, video and poster fields shared by the cover and gallery items, with
 * size hints for where they show. Videos are uploaded as plain files: Sanity
 * serves them as-is (no streaming or transcoding), so keep them short,
 * compressed loops. `optional` media only warns when left half-filled, since
 * the site falls back to another asset.
 */
export const mediaFields = ({
  imageSize,
  videoSize,
  optional = false,
}: {
  imageSize: string
  videoSize: string
  optional?: boolean
}) => {
  const level = <R extends {warning: () => R}>(rule: R) => (optional ? rule.warning() : rule)
  return [
    defineField({
      name: 'image',
      type: 'accessibleImage',
      description: imageSize,
      hidden: ({parent}) => parent?.kind !== 'image',
      validation: (rule) =>
        level(
          rule.custom((value, {parent}) =>
            (parent as MediaParent)?.kind === 'image' && !value ? 'Add an image' : true,
          ),
        ),
    }),
    defineField({
      name: 'video',
      type: 'file',
      description: `MP4 or WebM. ${videoSize}`,
      options: {accept: 'video/mp4,video/webm'},
      hidden: ({parent}) => parent?.kind !== 'video',
      validation: (rule) =>
        level(
          rule.custom((value, {parent}) =>
            (parent as MediaParent)?.kind === 'video' && !value?.asset ? 'Upload a video' : true,
          ),
        ),
    }),
    defineField({
      name: 'poster',
      type: 'accessibleImage',
      description: 'Shown while the video loads, under 1 MB. Its alt text describes the video.',
      hidden: ({parent}) => parent?.kind !== 'video',
      validation: (rule) =>
        level(
          rule.custom((value, {parent}) =>
            (parent as MediaParent)?.kind === 'video' && !value ? 'Add a poster image' : true,
          ),
        ),
    }),
  ]
}

/** Cover-sized image or video. The optional variant starts empty so it never blocks publishing. */
const coverMedia = ({
  name,
  title,
  optional = false,
}: {
  name: string
  title: string
  optional?: boolean
}) =>
  defineType({
    name,
    title,
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
        initialValue: optional ? undefined : 'image',
        validation: (rule) => (optional ? rule : rule.required()),
      }),
      // Full screen, so larger than the gallery
      ...mediaFields({
        imageSize: 'Under 2 MB.',
        videoSize: 'Under 8 MB.',
        optional,
      }),
    ],
    preview: {
      select: {
        kind: 'kind',
        image: 'image',
        poster: 'poster',
        alt: 'image.alt',
        posterAlt: 'poster.alt',
      },
      prepare: ({kind, image, poster, alt, posterAlt}) => ({
        title: (kind === 'video' ? posterAlt : alt) || 'Untitled media',
        subtitle: kind === 'video' ? 'Video' : 'Image',
        media: kind === 'video' ? poster : image,
      }),
    },
  })

/** A project's cover image or video (gallery items extend it, see galleryItem). */
export const projectMedia = coverMedia({name: 'projectMedia', title: 'Cover media'})

/** Optional portrait cover for phones; the site falls back to the cover when it's empty. */
export const mobileCoverMedia = coverMedia({
  name: 'mobileCoverMedia',
  title: 'Mobile cover media',
  optional: true,
})
