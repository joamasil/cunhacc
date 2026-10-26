import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { sanityClient } from 'sanity:client';

const builder = createImageUrlBuilder(sanityClient);

/** Image URL builder — respects the editor's hotspot/crop; the CDN serves webp/avif automatically. */
export const urlFor = (source: SanityImageSource) => builder.image(source).auto('format');
