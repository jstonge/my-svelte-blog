<script>
import BackgroundPlot from './BackgroundPlot.svelte';
import StoryHeader from '$lib/components/StoryHeader.svelte';
import ScrollIndicator from '$lib/components/helpers/ScrollIndicator.svelte';
import Tooltip from '$lib/components/helpers/Tooltip.svelte';

import { renderTextContent, scrollyContent } from '$lib/components/helpers/ScrollySnippets.svelte';

let { story, data } = $props();
let scrollyIndex = $state({ value: undefined });
let tooltip = $state({ visible: false, x: 0, y: 0, content: '' });
</script>

<ScrollIndicator />

<article class="story theme-dark" style="--theme-bg: #353839; --theme-footer: #414A4C;">
    <div class="prose">
        <StoryHeader
            title={data.title}
            subtitle={data.subtitle}
            authors={data.authors}
            date={data.date}
        />

        <section id="intro" class="prose">
            {#each data.introduction as item}
                {@render renderTextContent(item)}
            {/each}
        </section>
    </div>
    
    <section id="scrolly" class="scrolly-fullscreen">
        <div class="scrolly-chart">
            <BackgroundPlot scrollyIndex={scrollyIndex.value} bind:tooltip />
        </div>
        {@render scrollyContent(data.steps, scrollyIndex)}
    </section>
    
    <h2 class="prose">Conclusion</h2>
    <section id="conclusion" class="prose">
        {#each data.conclusion as item}
            {@render renderTextContent(item)}
        {/each}
    </section>
</article>

<Tooltip
    visible={tooltip.visible}
    x={tooltip.x}
    y={tooltip.y}
    content={tooltip.content}
/>

<style>
    /* Custom scrolly step boxes for this story */
    :global(.theme-dark .scrolly-content .step > *),
    :global(.theme-dark .scrolly-content .step > * *) {
        background: white;
        box-shadow: 1px 1px 30px rgba(252, 220, 252, 1);
        border: 1px solid plum;
        border-radius: 6px;
        color: #353839 !important;
    }

    /* Remove duplicate styles on nested elements */
    :global(.theme-dark .scrolly-content .step > * *) {
        background: transparent;
        box-shadow: none;
        border: none;
        border-radius: 0;
    }
</style>
