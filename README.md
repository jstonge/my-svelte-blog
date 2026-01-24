# Custom Researh Website Template

## Goal

This is an experimental Template to scaffold web applications with data-driven visual essays. It aims to demonstrate techniques we do at the VCSI to do visual essays.

## Project structure

```zsh
src/
├── styles/
│   ├── app.css              # Global tokens, base styles, .page class
│   └── scrolly.css          # Scrolly patterns (.scrolly-with-chart, .scrolly-fullscreen)
│
├── routes/
│   └── +layout.svelte       # App shell: Nav + main + Footer (no constraints)
│
└── lib/
    ├── layouts/
    │   ├── PageLayout.svelte    # Centered pages (max-width, padding, nav offset)
    │   └── ScrollyLayout.svelte # Full-width stories (nav offset, .prose centering, section spacing)
    │
    └── components/
        ├── StoryHeader.svelte           # Reusable title/subtitle/authors/date block
        └── helpers/
            └── ScrollySnippets.svelte   # Scrolly content snippets (imports scrolly.css)

```

flow 

```zsh
+layout.svelte (shell)
    │
    ├── PageLayout         → About page, etc.
    │   └── .page class from app.css
    │
    └── ScrollyLayout      → Stories
        ├── StoryHeader
        ├── .prose sections (intro, conclusion)
        └── .scrolly-with-chart (from scrolly.css)
            ├── .scrolly-chart
            └── scrollyContent snippet
```

## Features

### Global

Particular settings provide some rough edges of the website, as put by [Josh Comeau](https://www.joshwcomeau.com/css/custom-css-reset/). 

 - Minimalist global styling in `src/styles/` directory: `app.css`, `variables.css`, `fonts.css` and `reset.css`. 
  - `Dark mode`: we favor users' preference using `ModeWatcher`, then use variables in our styling sheets to handle dark/light mode.
 - `Mobile-first philosophy:` we try as much as we can to make the webb app enjoyable on mobile, as most traffic comes from there.
 - Shared svelte components can be found in `src/lib/components`:
  - In `helpers/`, we have helper components:
    - `MarkdownRenderer.svelte` works in concert with copy.json to parse content as markdown, html, or maths.
    - `Scrolly.svelte` is the base component from The Pudding to do scrollytelling
    - `ScrollySnippets.svelte` combines the MarkdownRenderer and Scrolly components in [snippets](https://svelte.dev/docs/svelte/snippet) to facilitate reuse of established scrolly layout, i.e. content left-plot right, content top-plot underneath.

### Local

Inspired by The Pudding, each story lives in `src/lib/stories/story`:
  - Content is stored in a `data/copy.json`: when creating scrolly, key is the section name and values are list. Each entry in the list is a dictionary contains at least `type` (i.e. markdown, html, math) and `value`.
  - Stories can be found in `components/Index.svelte`. Each story contain local styling, which can sometimes need to overwrite the global styling.

### Using Remote functions

In front-end world, it is important to keep in mind the distinction between [server and client](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview#web_servers_and_http_a_primer). I keep in mind the distinction using the fact that, for example, static site generators are defined as such by their lack of [server-side logic](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side). As mozilla puts it, it means that "for any given URL, all users will receive the same content". In contrasts, dynamic websites can dynamically display data as required (e.g. when users are authenticated, display data will be shown differently for a given url).

Data loading is an infamous problem in frontend design, which is how data is sent from the server to the client. That is, how the server receiving requests from HTTP, send data to client (e.g. user's web browser). Remote functions are new tools to solve that problem in a way that is both efficient and readable. We favor that approach because we find this make the code more readble to newcomers; in particular, it allows us to transfer data from server to clients simply using async functions.

```js
//data.remote.ts`
import * as v from 'valibot';
import { prerender } from '$app/server';
import membersData from '$data/members.csv'

export const getMembers = prerender(async () => {
    return await membersData
});


export const getMember = prerender(
    v.string(),
    async (slug) => {
        return await membersData.filter(d => d.id == slug)
    },
    { dynamic: true }
);
```

and then we can do

```svelte
<script>
  import { page } from '$app/state';
  import { getMember } from '$lib/data.remote' 
  import Member from "$lib/components/Member.svelte";
  import Spinner from "$lib/components/helpers/Spinner.svelte";
</script>

{#await getMember(page.params.name)}
  <Spinner text="Loading member..." />
{:then author} 
    <Member {author}/>
{:catch error}
  <p>Error loading member: {error.message || 'Unknown error'}</p>
{/await}
```

## Dependencies:

 - [mode-watcher](https://github.com/svecosystem/mode-watcher): Simple utilities to manage light & dark mode in your SvelteKit app.
 - [@rollup/plugin-dsv](https://www.npmjs.com/package/@rollup/plugin-dsv?activeTab=dependents): loading CSVs, requires to be passed as argument in `vite.config.ts`.
 - [lucide](https://lucide.dev/): Beautiful & consistent icons
 - [svelte-plot](https://svelteplot.dev/): A Svelte-native visualization framework based on the layered grammar of graphics principles.
 - [svelte-exmarkdown](https://github.com/ssssota/svelte-exmarkdown): Svelte component to render markdown. 
    - [katex](https://katex.org/): for math rendering in our markdown renderer
    - [rehype](https://github.com/rehypejs/rehype): rehype is an ecosystem of plugins that work with HTML as structured data, specifically ASTs (abstract syntax trees)