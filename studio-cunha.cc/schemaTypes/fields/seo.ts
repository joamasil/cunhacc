import {defineField} from 'sanity'

/**
 * Meta title, meta description and OG image, placed straight into a
 * document's "SEO" tab. Title and description are required on every page;
 * the OG image falls back to the one in Site settings.
 */
export const seoFields = ({titleHint}: {titleHint: string}) => [
  defineField({
    name: 'metaTitle',
    title: 'Meta title',
    type: 'string',
    group: 'seo',
    description: `${titleHint} Max 60 characters.`,
    validation: (rule) => [rule.required(), rule.max(60).warning('Search results cut off around 60 characters')],
  }),
  defineField({
    name: 'metaDescription',
    title: 'Meta description',
    type: 'text',
    rows: 2,
    group: 'seo',
    description: 'Shown in search results and link previews. Max 160 characters.',
    validation: (rule) => [rule.required(), rule.max(160).warning('Search results cut off around 160 characters')],
  }),
  defineField({
    name: 'ogImage',
    title: 'OG image',
    // Plain image: share previews don't read alt text, so no alt field here
    type: 'image',
    group: 'seo',
    description: 'Shown when the page is shared. 1200 × 630 px, under 1 MB.',
  }),
]
