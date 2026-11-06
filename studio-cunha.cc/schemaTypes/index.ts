import {about} from './documents/about'
import {errorPage} from './documents/errorPage'
import {project} from './documents/project'
import {siteSettings} from './documents/siteSettings'
import {accessibleImage} from './objects/accessibleImage'
import {galleryItem} from './objects/galleryItem'
import {infoBlock} from './objects/infoBlock'
import {mobileCoverMedia, projectMedia} from './objects/projectMedia'
import {readMoreBreak} from './objects/readMoreBreak'

export const schemaTypes = [
  // Documents
  project,
  about,
  errorPage,
  siteSettings,
  // Objects
  accessibleImage,
  projectMedia,
  mobileCoverMedia,
  galleryItem,
  readMoreBreak,
  infoBlock,
]

/** Document types that exist exactly once (fixed IDs, see structure.ts). */
export const singletonTypes = new Set(['about', 'errorPage', 'siteSettings'])
