<script>
  import { page } from '$app/state';
  import { getMember } from '$lib/data.remote' 
  
  import Meta from "$lib/components/Meta.svelte";
  import Member from "$lib/components/Member.svelte";
  import Spinner from "$lib/components/helpers/Spinner.svelte";
  
  const preloadFont = [
    "/assets/fonts/tiempos/TiemposTextWeb-Regular.woff2",
    "/assets/fonts/tiempos/TiemposTextWeb-Bold.woff2",
    "/assets/fonts/atlas/AtlasGrotesk-Regular-Web.woff2",
    "/assets/fonts/atlas/AtlasGrotesk-Bold-Web.woff2",
    "/assets/fonts/atlas/AtlasTypewriter-Medium-Web.woff2"
  ];

</script>

<Meta
  title="Member"
  description="Author bio"
  {preloadFont}
/>

<div class="page">
  {#await getMember(page.params.name)}
    <Spinner text="Loading member..." />
  {:then author}
    <Member {author}/>
  {:catch error}
    <p>Error loading member: {error.message || 'Unknown error'}</p>
  {/await}
</div>
