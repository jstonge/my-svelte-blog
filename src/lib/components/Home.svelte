<script>
  import Spinner from './helpers/Spinner.svelte';
  import StoryGrid from '$lib/components/StoryGrid.svelte';
  import { getStories } from '$lib/data.remote';
</script>

<!-- Stories Section -->
<section class="stories page">
      {#await getStories()}
        <Spinner/>
      {:then stories}
        <StoryGrid {stories} />
      {/await}
</section>


<style>
  
  .stories {
    padding: 4rem var(--page-padding);
  }

</style>
