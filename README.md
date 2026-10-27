# cunha.cc

Portfolio site (`web/`, Astro) with its content in Sanity (`studio-cunha.cc/`).

## Local development

```bash
npm install
npm run dev      # site at http://localhost:4321
npm run studio   # Sanity Studio at http://localhost:3333
```

The site reads **published** content from Sanity. In `npm run dev`, refresh the page to see a new publish. Drafts never show.

`web/.env` (see `web/.env.example`) holds the Sanity project ID and dataset. They are public values, also set in `netlify.toml`.

## Publishing content

1. Edit in the Studio (cunhacc.sanity.studio or localhost:3333) and click **Publish**.
2. A Sanity webhook calls a Netlify build hook, and Netlify rebuilds the site. The change is live about a minute later.

If a build fails (for example, Site settings or About not published), Netlify keeps the previous version live. The error is in the Netlify deploy log.

## Deploying the Studio

```bash
cd studio-cunha.cc && npm run deploy
```

Schema changes only reach cunhacc.sanity.studio after a deploy. Content doesn't need one.

## One-time setup: Netlify and the webhook

1. **Netlify:** add a new site from this repo. `netlify.toml` sets the build command, publish folder and env vars.
2. **Build hook:** in Netlify, go to Site configuration → Build & deploy → Build hooks → Add build hook (name: "Sanity publish"). Copy the URL.
3. **Sanity webhook:** go to sanity.io/manage → project cunha.cc → API → Webhooks → Create webhook:
   - URL: the Netlify build hook URL
   - Dataset: `production`
   - Trigger on: Create, Update, Delete
   - Filter: `_type in ["project", "about", "siteSettings"]`
   - HTTP method: `POST`
   - Leave "Trigger webhook when drafts are modified" off, so only publishes rebuild the site.
