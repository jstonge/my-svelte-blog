<script module>
    import '$styles/scrolly.css';
    import Scrolly from '$lib/components/helpers/Scrolly.svelte';
    import Md from '$lib/components/helpers/MarkdownRenderer.svelte';

    export { scrollyContent, renderTextContent };
</script>

<!-- Shared snippet for rendering common text content types (html, markdown, math) -->
{#snippet renderTextContent(item)}
    {#if item.type === "html"}
        {@html item.value}
    {:else if item.type === "markdown"}
        <Md text={item.value}/>
    {:else if item.type === "math"}
        <div class="plot-container">
            <Md text={item.value}/>
        </div>
    {/if}
{/snippet}

<!-- Generic scrolly wrapper for story content
     scrollyIndex should be wrapped in an object so we can bind to it -->
{#snippet scrollyContent(steps, scrollyIndexObj, contentRenderer = renderTextContent)}
    <div class="scrolly-content">
        <div class="spacer"></div>
        <Scrolly bind:value={scrollyIndexObj.value}>
            {#each steps as step, i}
                {@const active = scrollyIndexObj.value === i}
                <div class="step" class:active>
                    <div class="step-content">
                        {@render contentRenderer(step)}
                    </div>
                </div>
            {/each}
        </Scrolly>
        <div class="spacer"></div>
    </div>
{/snippet}

<style>
    /* Component-specific styles only */
    .plot-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 0;
    }
</style>
