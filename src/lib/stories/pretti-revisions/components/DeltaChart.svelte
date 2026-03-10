<script>
    import { Plot, RuleX, RuleY, Rect, AxisX, AxisY, BrushX, Frame } from 'svelteplot';

    let { revisions, fullDomain, margin, titleChanges = [], xField = 'date', brush = $bindable() } = $props();
</script>

<Plot
    height={220}
    marginLeft={margin.left}
    marginRight={margin.right}
    marginBottom={30}
    x={{ label: false, domain: fullDomain, axis: false }}
    y={{ grid: true, axis: false }}
>
    <RuleX
        data={revisions}
        x={xField}
        y1={0}
        y2="token_diff"
        stroke={d => d.token_diff >= 0 ? '#2ca02c' : '#d62728'}
        strokeWidth={1.5}
    />
    {#each titleChanges as tc}
    <RuleX
        data={[{ x: xField === 'date' ? tc.date : tc.revision_idx }]}
        x="x"
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="4 3"
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
    <RuleY y={0} stroke="black" />
    <Frame stroke="black" />
    <BrushX bind:brush />
    <AxisX tickFormat={xField === 'date' ? d => new Date(String(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined} />
    <AxisY title="Δ tokens" />
</Plot>
