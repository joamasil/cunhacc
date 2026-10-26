import {defineField} from 'sanity'

/**
 * Meta title, meta description and OG image, placed straight into a
 * document's "SEO" tab. Pages leave them optional (empty falls back to the
 * page content, then Site settings); Site settings requires them as the defaults.
 */
export const seoFields = ({required = false, titleHint}: {required?: boolean; titleHint: string}) => [
  defineField({
    name: 'metaTitle',
    title: 'Meta title',
    type: 'string',
    group: 'seo',
    description: titleHint,
    validation: (rule) => {
      const limit = rule.max(60).warning('Search results cut off around 60 characters')
      return required ? [rule.required(), limit] : limit
    },
  }),
  defineField({
    name: 'metaDescription',
    title: 'Meta description',
    type: 'text',
    rows: 2,
    group: 'seo',
    description: 'Shown in search results and link previews.',
    validation: (rule) => {
      const limit = rule.max(160).warning('Search results cut off around 160 characters')
      return required ? [rule.required(), limit] : limit
    },
  }),
  defineField({
    name: 'ogImage',
    title: 'OG image',
    // Plain image: share previews don't read alt text, so no alt field here
    type: 'image',
    group: 'seo',
    description: 'Shown when the page is shared. 1200 × 630 px works best.',
  }),
]
