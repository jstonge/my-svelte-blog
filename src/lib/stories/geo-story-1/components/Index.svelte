<script>
    import GeoScrollyPlot from './GeoScrollyPlot.svelte';
    import StoryHeader from '$lib/components/StoryHeader.svelte';
    import ScrollIndicator from '$lib/components/helpers/ScrollIndicator.svelte';

    import { renderTextContent, scrollyContent } from '$lib/components/helpers/ScrollySnippets.svelte';

    let { story, data } = $props();

    let scrollyIndex = $state({ value: undefined });
</script>

<ScrollIndicator />

<article class="story">
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
            <GeoScrollyPlot scrollyIndex={scrollyIndex.value} />
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
