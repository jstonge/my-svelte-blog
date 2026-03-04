<script>
    import { Plot, RuleX, Rect, AxisX, AxisY, BrushX } from 'svelteplot';

    let { revisions, fullDomain, margin, titleChangeRev, dayBoundaries, brush = $bindable() } = $props();
</script>

<Plot
    height={220}
    axes={false}
    marginLeft={margin.left}
    marginRight={margin.right}
    x={{ label: 'revision index', domain: fullDomain }}
    y={{ grid: true }}
>
    <RuleX
        data={revisions}
        x="revision_idx"
        y1={0}
        y2="token_diff"
        stroke={d => d.token_diff >= 0 ? '#2ca02c' : '#d62728'}
        strokeWidth={1.5}
    />
    <RuleX
        data={[{ x: titleChangeRev }]}
        x="x"
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="4 3"
        style="pointer-events: none"
    />
    {#each dayBoundaries as { rev }}
        <RuleX
            data={[{ x: rev }]}
            x="x"
            stroke="#b07d2b"
            strokeWidth={1}
            strokeDasharray="2 3"
            style="pointer-events: none"
        />
    {/each}
    {#if brush.enabled && brush.x1 != null && brush.x2 != null}
        <Rect
            data={[{ x1: brush.x1, x2: brush.x2 }]}
            x1="x1"
            x2="x2"
            fill="lightgrey"
            fillOpacity={0.22}
            stroke="black"
            style="pointer-events: none"
        />
    {/if}
    <BrushX bind:brush />
    <AxisX title="revision index" />
    <AxisY title="Δ tokens" />
</Plot>
