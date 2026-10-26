import {about} from './documents/about'
import {project} from './documents/project'
import {siteSettings} from './documents/siteSettings'
import {accessibleImage} from './objects/accessibleImage'
import {galleryItem} from './objects/galleryItem'
import {infoBlock} from './objects/infoBlock'
import {projectMedia} from './objects/projectMedia'
import {readMoreBreak} from './objects/readMoreBreak'
import {socialLink} from './objects/socialLink'

export const schemaTypes = [
  // Documents
  project,
  about,
  siteSettings,
  // Objects
  accessibleImage,
  projectMedia,
  galleryItem,
  readMoreBreak,
  infoBlock,
  socialLink,
]

/** Document types that exist exactly once (fixed IDs, see structure.ts). */
export const singletonTypes = new Set(['about', 'siteSettings'])
