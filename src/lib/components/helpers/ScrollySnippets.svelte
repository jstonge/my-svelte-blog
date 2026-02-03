<script module lang="ts">
    import '$styles/scrolly.css';
    import Scrolly from '$lib/components/helpers/Scrolly.svelte';
    import Md from '$lib/components/helpers/MarkdownRenderer.svelte';
    import type { Snippet } from 'svelte';

    type ContentItem = {
        type: 'html' | 'markdown' | 'math' | 'question' | 'text' | 'code' | 
        'language';
        value: string;
    };

    type ScrollyIndexObj = {
        value: number | undefined;
    };

    export { scrollyContent, renderTextContent };
</script>

<!-- Shared snippet for rendering common text content types (html, markdown, math) -->
{#snippet renderTextContent(item: ContentItem)}
    {#if item.type === "html"}
        {@html item.value}
    {:else if item.type === "markdown"}
        <Md text={item.value}/>
    {:else if item.type === "math"}
        <div class="plot-container">
            <Md text={item.value}/>
        </div>
    {:else if item.type === "code"}
        {@const codeValue = Array.isArray(item.value) ? item.value.join('\n') : item.value}
        <div class="code-block">
            {#if item.language}
            <div class="code-language">{item.language}</div>
            {/if}
            <Md text={`\`\`\`${item.language || ''}\n${codeValue}\n\`\`\``}/>
        </div>
    {/if}
{/snippet}

<!-- Generic scrolly wrapper for story content
     scrollyIndex should be wrapped in an object so we can bind to it -->
{#snippet scrollyContent(steps: ContentItem[], scrollyIndexObj: ScrollyIndexObj, contentRenderer: Snippet<[ContentItem]> = renderTextContent)}
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
