import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {CogIcon} from '@sanity/icons/Cog'
import {ErrorScreenIcon} from '@sanity/icons/ErrorScreen'
import {PizzaIcon} from './schemaTypes/icons/PizzaIcon'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {UserIcon} from '@sanity/icons/User'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // Drag and drop to set the slider order
      orderableDocumentListDeskItem({type: 'project', title: 'Projects', icon: SparklesIcon, S, context}),
      // Singletons: fixed document IDs, so there is only ever one of each
      S.listItem()
        .title('About')
        .icon(UserIcon)
        .child(S.document().schemaType('about').documentId('about').title('About')),
      S.listItem()
        .title('Pizza hunts')
        .icon(PizzaIcon)
        .child(S.document().schemaType('pizzaHunts').documentId('pizzaHunts').title('Pizza hunts')),
      S.listItem()
        .title('Error page')
        .icon(ErrorScreenIcon)
        .child(S.document().schemaType('errorPage').documentId('errorPage').title('Error page')),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
    ])
