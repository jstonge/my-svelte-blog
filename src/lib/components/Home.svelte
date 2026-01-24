<script>
  import DotsToImage from '$lib/components/DotsToImage.svelte';
  import StoryGrid from '$lib/components/StoryGrid.svelte';
  import CopyCodeBlock from '$lib/components/helpers/CopyCodeBlock.svelte';
  import { getStories } from '$lib/data.remote';
  import { ArrowRight } from '@lucide/svelte';
</script>

<!-- Hero Section -->
<section class="hero page">
  <div class="hero-inner">
    <div class="hero-text">
      <h1>Custom Research Website</h1>
      <p>A maintainable, reusable and extensible website template to tell your stories.</p>
      <div class="code-blocks">
        <CopyCodeBlock
          command="npx degit joysofcode/sveltekit-remote-functions#annotated-boxes example"
          label="Annotated branch"
        />
        <CopyCodeBlock
          command="npx degit Vermont-Complex-Systems/website-template example"
          label="Main branch"
        />
        <span class="github-row">For installation details, features, and more visit <a href="https://github.com/Vermont-Complex-Systems/website-template" target="_blank" rel="noopener noreferrer" class="github-link">GitHub <ArrowRight size={16} /></a></span>
      </div>
    </div>
    <DotsToImage imgFilePath='/octopus-swim-right.png' />
  </div>
</section>

<!-- Stories Section -->
<section class="stories page">
  {#await getStories()}
    <div class="loading">Loading stories...</div>
  {:then stories}
    <StoryGrid {stories} />
  {/await}
</section>

<!-- Why Svelte Section -->
<section class="why-svelte page">
  <h2>Why Svelte and Sveltekit?</h2>
  <div class="reasons-grid">
    <div class="reason">
      <h3>Use Any JS Library Directly</h3>
      <p>Svelte compiles to vanilla JavaScript, so you can use D3, Three.js, Observable Plot, or any library without wrappers. No React-specific ports needed.</p>
    </div>
    <div class="reason">
      <h3>Perfect for Data Visualization</h3>
      <p>Fine-grained reactivity means smooth transitions and efficient updates. Used by <a href="https://github.com/the-pudding/svelte-starter" target="_blank" rel="noopener noreferrer">The Pudding</a> and data journalism teams for interactive charts, maps, and scrollytelling, e.g. how to <a href="https://youtu.be/5IcY0biPhoQ?si=K0OobYpBgwtFcgR3" target="_blank" rel="noopener noreferrer">build a Beeswarm Chart with Svelte and D3</a>.</p>
    </div>
    <div class="reason">
      <h3>Readable Code for Collaborators</h3>
      <p>Svelte components look like HTML with superpowers. Graduate students and collaborators can contribute without deep framework knowledge.</p>
    </div>
    <div class="reason">
      <h3>As Simple as Possible, but No Simpler</h3>
      <p>The Svelte team believes in removing unnecessary complexity without sacrificing power. <a href="https://www.smashingmagazine.com/2025/01/svelte-5-future-frameworks-chat-rich-harris/" target="_blank" rel="noopener noreferrer">Read more</a> or watch <a href="https://gitnation.com/contents/svelte-5-improvements" target="_blank" rel="noopener noreferrer">Rich Harris talking about Svelte 5's North Star</a>.</p>
    </div>
    <div class="reason">
      <h3>Minimal Boilerplate</h3>
      <p>No useState, useEffect, or dependency arrays. Reactivity is built into the language. Spend time on your research, not fighting the framework.</p>
    </div>
    <div class="reason">
      <h3>Progressive Enhancement</h3>
      <p>Forms and links work without JavaScript, then get enhanced when it's available. Your app stays <a href="https://www.gov.uk/service-manual/technology/using-progressive-enhancement" target="_blank" rel="noopener noreferrer">resilient</a> while still feeling modern when JS loads.</p>
    </div>
  </div>
  <p class="svelte-cta">Learn more at <a href="https://svelte.dev/" target="_blank" rel="noopener noreferrer">svelte.dev</a> or follow their <a href="https://svelte.dev/tutorial/svelte/welcome-to-svelte" target="_blank" rel="noopener noreferrer">tutorial</a></p>
</section>

<style>
/* ---------------- Hero Section ---------------- */
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 2 * var(--nav-height));
  padding: 0 var(--page-padding);
  box-sizing: border-box;
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  width: 100%;
  max-width: var(--page-max-width);
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 55%;
}

.hero-text h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  margin: 0;
  font-family: var(--serif);
}

.hero-text p {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  margin: 0;
  color: var(--color-gray-700);
}

.code-blocks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.github-row {
  display: inline-flex;
  align-items: center;
  font-family: var(--sans);
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-top: 0.5rem;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  color: var(--color-fg);
  text-decoration: none;
  margin-left: 0.25rem;
  transition: gap 0.2s ease;
}

.github-link:hover {
  gap: 0.5rem;
}

/* Make DotsToImage grow to fill space */
.hero-inner > :global(DotsToImage) {
  flex: 1;
  height: 50%;
}

/* ---------------- Stories Section ---------------- */
.stories {
  padding: 4rem var(--page-padding);
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--color-fg);
  opacity: 0.7;
}

/* ---------------- Why Svelte Section ---------------- */
.why-svelte {
  padding: 4rem var(--page-padding);
  background: rgba(0, 0, 0, 0.02);
}

.why-svelte h2 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-family: var(--serif);
  margin: 0 0 2rem 0;
  text-align: center;
}

.reasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.reason {
  padding: 1.5rem;
  background: var(--color-bg);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.reason h3 {
  font-family: var(--sans);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--color-fg);
}

.reason p {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  color: var(--color-gray-700);
}

.svelte-cta {
  text-align: center;
  margin-top: 2rem;
  font-size: 1rem;
  color: var(--color-gray-700);
}

.svelte-cta a {
  color: var(--color-fg);
  font-weight: 500;
}

/* ---------------- Responsive ---------------- */
@media (max-width: 768px) {
  .hero-inner {
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }
  .hero-text {
    max-width: 90%;
  }
  .hero-text h1 {
    font-size: 2.5rem;
  }
  .hero-text p {
    font-size: 1.2rem;
  }
}
</style>
