<script>
  import { getStory } from '$lib/data.remote.js';

  let { params } = $props();

  // Capture the slug value at initialization
  const slug = params.slug;

  // Use await directly in the component
  const { story, copyData } = await getStory(slug);

  // Dynamically import the story component
  const StoryComponent = await import(`$lib/stories/${slug}/components/Index.svelte`);
</script>

<!-- Render the story component with its data -->
<svelte:boundary>
  <StoryComponent.default {story} data={copyData} />
  {#snippet pending()}
    <p style="text-align:center; padding:2rem; color:#666;">Loading...</p>
  {/snippet}
  {#snippet failed(error)}
    <p style="text-align:center; padding:2rem; color:#d62728;">Error: {error?.message ?? 'Unknown error'}</p>
  {/snippet}
</svelte:boundary>
