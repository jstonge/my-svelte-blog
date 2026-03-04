<script>
    import { Plot, Line, Dot, RuleX, Rect, AxisX, AxisY, BrushX, Text } from 'svelteplot';
    import { bisector } from 'd3';
    import rawData from '../data/test-2026-01-25_82203651.json';

    // Prepare chart data with token diffs
    const revisions = rawData.revision_history.map((rev, i, arr) => ({
        ...rev,
        token_diff: i === 0 ? 0 : rev.total_tokens - arr[i - 1].total_tokens,
    }));

    // Precompute all token-level diffs (avoids recomputing on every hover)
    const tokenDiffs = revisions.map((rev, i) => {
        if (i === 0) return { added: [], removed: [] };
        const curr = rev.tokens;
        const prev = revisions[i - 1].tokens;
        const allKeys = new Set([...Object.keys(curr), ...Object.keys(prev)]);
        const changes = [];
        for (const key of allKeys) {
            const c = curr[key] ?? 0;
            const p = prev[key] ?? 0;
            if (c !== p) changes.push({ token: key, diff: c - p });
        }
        changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
        const top = changes;
        return {
            added: top.filter(d => d.diff > 0),
            removed: top.filter(d => d.diff < 0),
        };
    });

    // Precompute first revision index where each token appears
    const firstSeen = new Map();
    for (const rev of revisions) {
        for (const token of Object.keys(rev.tokens)) {
            if (!firstSeen.has(token)) firstSeen.set(token, rev.revision_idx);
        }
    }

    // Brush state for bottom chart → filters top chart (start with first 100)
    let brush = $state({ x1: 1, x2: 100, enabled: true });
    const fullDomain = [1, revisions.length];

    // Derive the top chart domain from brush selection
    let topDomain = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? [Math.round(brush.x1), Math.round(brush.x2)]
            : fullDomain
    );

    // Filter revisions for the top chart based on brush
    let filteredRevisions = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? revisions.filter(r => r.revision_idx >= Math.round(brush.x1) && r.revision_idx <= Math.round(brush.x2))
            : revisions
    );

    let hoveredRevision = $state(null);
    let pinnedRevision = $state(null);
    let tokenDiff = $derived(hoveredRevision ? tokenDiffs[hoveredRevision.revision_idx - 1] : null);

    // Token panel mode
    let panelMode = $state('diff'); // 'diff' | 'first-seen' | 'frequency'

    const modeInfo = {
        'diff': {
            question: 'What changed in this edit?',
            detail: 'All tokens in the revision. Added in green, reduced in red, struck-through if fully removed. E.g. "3+2" = was 3, gained 2.'
        },
        'first-seen': {
            question: 'What new language was introduced?',
            detail: 'Only tokens appearing for the first time ever in this revision.'
        },
        'frequency': {
            question: 'What are the most repeated words?',
            detail: 'All tokens sorted by how often they appear in this revision.'
        }
    };

    // The revision shown in the token panel (pinned takes priority)
    let panelRevision = $derived(pinnedRevision ?? hoveredRevision);

    // Token list for the panel, varies by mode
    let panelTokenList = $derived.by(() => {
        if (!panelRevision) return [];
        const idx = panelRevision.revision_idx - 1;
        const tokens = panelRevision.tokens;
        const entries = Object.entries(tokens);

        if (panelMode === 'diff') {
            const diffMap = new Map();
            const removedTokens = []; // tokens completely gone from this revision
            if (idx > 0) {
                const prev = revisions[idx - 1].tokens;
                const allKeys = new Set([...Object.keys(tokens), ...Object.keys(prev)]);
                for (const key of allKeys) {
                    const c = tokens[key] ?? 0;
                    const p = prev[key] ?? 0;
                    if (c !== p) {
                        diffMap.set(key, c - p);
                        // Token was in prev but completely removed
                        if (c === 0) removedTokens.push({ token: key, count: 0, diff: -p, isNew: false, firstRev: 0 });
                    }
                }
            }
            const current = entries
                .map(([token, count]) => ({ token, count, diff: diffMap.get(token) ?? 0, isNew: false, firstRev: 0 }));
            return [...current, ...removedTokens]
                .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff) || b.count - a.count);
        }

        if (panelMode === 'first-seen') {
            // Only tokens that appear for the first time in this revision
            const revIdx = panelRevision.revision_idx;
            return entries
                .filter(([token]) => (firstSeen.get(token) ?? 1) === revIdx)
                .map(([token, count]) => ({ token, count }))
                .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
        }

        // 'frequency' — all tokens sorted by count in this revision
        return entries
            .map(([token, count]) => ({ token, count, diff: 0, isNew: false, firstRev: 0 }))
            .sort((a, b) => b.count - a.count);
    });

    let mouseX = $state(0);
    let mouseY = $state(0);

    // Title change annotation
    const TITLE_CHANGE_REV = 160;
    // Explicit margins for the top chart — used both in Plot and mouse handler
    const MARGIN = { left: 55, right: 15, top: 30, bottom: 10 };

    let lineChartEl = $state(null);

    function handleChartMouseMove(e) {
        if (!lineChartEl) return;
        const svg = lineChartEl.querySelector('svg');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();

        const plotLeft = rect.left + MARGIN.left;
        const plotRight = rect.right - MARGIN.right;
        const plotWidth = plotRight - plotLeft;
        if (plotWidth <= 0) return;

        const frac = Math.max(0, Math.min(1, (e.clientX - plotLeft) / plotWidth));
        const idx = Math.round(frac * (filteredRevisions.length - 1));
        if (idx >= 0 && idx < filteredRevisions.length) {
            hoveredRevision = filteredRevisions[idx];
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    }

    function handleChartClick() {
        if (hoveredRevision) {
            // Toggle pin: click same revision to unpin, or pin a new one
            if (pinnedRevision && pinnedRevision.revision_idx === hoveredRevision.revision_idx) {
                pinnedRevision = null;
            } else {
                pinnedRevision = hoveredRevision;
            }
        }
    }

    function handleChartMouseLeave() {
        hoveredRevision = null;
    }
</script>

<h3 class="page-title"><a href="https://en.wikipedia.org/wiki/Killing_of_Alex_Pretti">Killing of Alex Pretti</a> — {revisions.length} revisions on 2026-01-25</h3>

<div class="layout">
    <div class="charts-col">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            bind:this={lineChartEl}
            onmousemove={handleChartMouseMove}
            onmouseleave={handleChartMouseLeave}
            onclick={handleChartClick}
        >
        <Plot
            height={300}
            axes={false}
            marginLeft={MARGIN.left}
            marginRight={MARGIN.right}
            marginTop={MARGIN.top}
            marginBottom={MARGIN.bottom}
            x={{ label: null, domain: topDomain, axis: null }}
            y={{ grid: true }}
        >
            <Line
                data={filteredRevisions}
                x="revision_idx"
                y="total_tokens"
                stroke="steelblue"
                strokeWidth={1.5}
            />
            <Dot
                data={filteredRevisions}
                x="revision_idx"
                y="total_tokens"
                fill="steelblue"
                r={3}
            />
            {#if pinnedRevision}
                <Dot
                    data={[pinnedRevision]}
                    x="revision_idx"
                    y="total_tokens"
                    fill="orange"
                    stroke="white"
                    strokeWidth={2}
                    r={6}
                    style="pointer-events: none"
                />
            {/if}
            {#if hoveredRevision && (!pinnedRevision || hoveredRevision.revision_idx !== pinnedRevision.revision_idx)}
                <Dot
                    data={[hoveredRevision]}
                    x="revision_idx"
                    y="total_tokens"
                    fill="orange"
                    stroke="white"
                    strokeWidth={2}
                    r={5}
                    opacity={0.6}
                    style="pointer-events: none"
                />
            {/if}
            <RuleX
                data={[{ x: TITLE_CHANGE_REV }]}
                x="x"
                stroke="#999"
                strokeWidth={1}
                strokeDasharray="4 3"
                style="pointer-events: none"
            />
            <Text
                data={[{ x: TITLE_CHANGE_REV - 2, text: '← ICE shooting in Minneapolis' }]}
                x="x"
                text="text"
                frameAnchor="top"
                textAnchor="end"
                dy={4}
                fontSize={10}
                fill="#666"
            />
            <Text
                data={[{ x: TITLE_CHANGE_REV + 2, text: 'Killing of Alex Pretti →' }]}
                x="x"
                text="text"
                frameAnchor="top"
                textAnchor="start"
                dy={4}
                fontSize={10}
                fill="#666"
            />
            <AxisY title="total_tokens" />
        </Plot>
        </div>

        <Plot
            height={220}
            axes={false}
            marginLeft={MARGIN.left}
            marginRight={MARGIN.right}
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
                data={[{ x: TITLE_CHANGE_REV }]}
                x="x"
                stroke="#999"
                strokeWidth={1}
                strokeDasharray="4 3"
                style="pointer-events: none"
            />
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
    </div>

    <div class="token-panel">
        <div class="panel-controls">
            <div class="mode-selector">
                <button class:active={panelMode === 'diff'} onclick={() => panelMode = 'diff'}>Diff</button>
                <button class:active={panelMode === 'first-seen'} onclick={() => panelMode = 'first-seen'}>First seen</button>
                <button class:active={panelMode === 'frequency'} onclick={() => panelMode = 'frequency'}>Frequency</button>
            </div>
            {#if pinnedRevision}
                <button class="unpin-btn" onclick={() => pinnedRevision = null}>unpin</button>
            {/if}
        </div>
        <div class="mode-description">
            <strong>{modeInfo[panelMode].question}</strong>
            <span>{modeInfo[panelMode].detail}</span>
        </div>
        {#if panelRevision}
            <h4>
                Rev {panelRevision.revision_idx}: {panelRevision.name}
                <span class="token-count">({panelRevision.total_tokens} tokens)</span>
                {#if !pinnedRevision}
                    <span class="pin-hint">click to pin</span>
                {/if}
            </h4>
            <div class="token-grid">
                {#if panelMode === 'diff'}
                    {#each panelTokenList as { token, count, diff }}
                        <span class="token-cell" class:cell-added={diff > 0} class:cell-removed={diff < 0 && count > 0} class:cell-gone={diff < 0 && count === 0}>
                            {token} <small>{#if diff !== 0}{count - diff}<span class="diff-label">{diff > 0 ? '+' : ''}{diff}</span>{:else}{count}{/if}</small>
                        </span>
                    {/each}
                {:else if panelMode === 'first-seen'}
                    {#each panelTokenList as { token, count }}
                        <span class="token-cell cell-new">
                            {token} <small>&times;{count}</small>
                        </span>
                    {/each}
                {:else}
                    {#each panelTokenList as { token, count }}
                        <span class="token-cell" class:cell-frequent={count > 1}>
                            {token} <small>&times;{count}</small>
                        </span>
                    {/each}
                {/if}
            </div>
        {:else}
            <p class="token-panel-placeholder">Hover over a revision to see tokens, click to pin</p>
        {/if}
    </div>
</div>

{#if hoveredRevision}
    {@const diff = tokenDiffs[hoveredRevision.revision_idx - 1]}
    <div class="tooltip" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
        <div class="tooltip-header">
            <strong>Rev {hoveredRevision.revision_idx}:</strong> {hoveredRevision.name}
        </div>
        <div class="tooltip-meta">
            <span class="tooltip-date">{new Date(hoveredRevision.date_modified).toLocaleString()}</span>
            {#if hoveredRevision.revision_comment}
                <span class="tooltip-comment">{hoveredRevision.revision_comment}</span>
            {/if}
        </div>
        <div class="tooltip-stats">
            tokens: {hoveredRevision.total_tokens}
            {#if hoveredRevision.revision_idx > 1}
                <span class={hoveredRevision.token_diff >= 0 ? 'positive' : 'negative'}>
                    ({hoveredRevision.token_diff >= 0 ? '+' : ''}{hoveredRevision.token_diff})
                </span>
            {/if}
        </div>
        {#if hoveredRevision.categories?.length > 0}
            <div class="tooltip-categories">
                {#each hoveredRevision.categories as cat}
                    <span class="tooltip-cat">{cat.replace('Category:', '')}</span>
                {/each}
            </div>
        {/if}
        {#if diff.added.length > 0 || diff.removed.length > 0}
            <div class="tooltip-diff">
                {#each diff.added as { token, diff: d }}
                    <span class="token-added">{token} (+{d})</span>
                {/each}
                {#each diff.removed as { token, diff: d }}
                    <span class="token-removed">{token} ({d})</span>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    :global(#content) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }
    .page-title {
        text-align: center;
        color: #333;
        margin: 0.5rem 0;
    }
    .layout {
        display: flex;
        gap: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1rem;
        align-items: center;
        justify-content: center;
    }
    .charts-col {
        flex: 0 1 800px;
        min-width: 0;
    }
    .tooltip {
        position: fixed;
        pointer-events: none;
        z-index: 1000;
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 12px;
        max-width: 350px;
        line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .tooltip-header {
        font-size: 11px;
        margin-bottom: 4px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
    }
    .tooltip-meta {
        font-size: 10px;
        color: #888;
        margin-bottom: 4px;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
    .tooltip-comment {
        font-style: italic;
        color: #555;
    }
    .tooltip-categories {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-bottom: 4px;
    }
    .tooltip-cat {
        font-size: 9px;
        background: #e8e8e8;
        color: #555;
        padding: 1px 4px;
        border-radius: 3px;
    }
    .tooltip-stats {
        margin-bottom: 6px;
        font-variant-numeric: tabular-nums;
    }
    .positive { color: #2ca02c; font-weight: 600; }
    .negative { color: #d62728; font-weight: 600; }
    .tooltip-diff {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
    }
    .token-added {
        background: #d4edda;
        color: #155724;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 10px;
        font-family: monospace;
    }
    .token-removed {
        background: #f8d7da;
        color: #721c24;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 10px;
        font-family: monospace;
    }
    .token-panel {
        flex: 1;
        min-width: 250px;
        max-width: 500px;
        min-height: 120px;
        max-height: calc(100vh - 4rem);
        display: flex;
        flex-direction: column;
    }
    .token-panel h4 {
        margin: 0 0 0.5rem;
        color: #333;
        font-size: 14px;
    }
    .token-panel h4 .token-count {
        font-weight: normal;
        color: #666;
    }
    .token-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        flex: 1;
        overflow-y: auto;
        align-content: flex-start;
    }
    .token-cell {
        display: inline-flex;
        align-items: baseline;
        gap: 3px;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-family: monospace;
        background: #f0f0f0;
        color: #333;
    }
    .token-cell small {
        font-size: 10px;
        color: #888;
    }
    .cell-added {
        background: #d4edda;
        color: #155724;
    }
    .cell-added small {
        color: #155724;
    }
    .cell-removed {
        background: #f8d7da;
        color: #721c24;
    }
    .cell-removed small {
        color: #721c24;
    }
    .panel-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }
    .mode-selector {
        display: flex;
        gap: 0;
    }
    .mode-selector button {
        font-size: 12px;
        padding: 3px 10px;
        border: 1px solid #ccc;
        background: #f8f8f8;
        color: #666;
        cursor: pointer;
        margin-right: -1px;
    }
    .mode-selector button:first-child {
        border-radius: 4px 0 0 4px;
    }
    .mode-selector button:last-child {
        border-radius: 0 4px 4px 0;
    }
    .mode-selector button.active {
        background: #333;
        color: white;
        border-color: #333;
        z-index: 1;
        position: relative;
    }
    .mode-description {
        font-size: 11px;
        color: #666;
        line-height: 1.4;
        margin-bottom: 0.5rem;
        padding: 4px 8px;
        background: #f8f8f8;
        border-radius: 4px;
        border-left: 3px solid #333;
    }
    .mode-description strong {
        display: block;
        color: #333;
        margin-bottom: 1px;
    }
    .diff-label {
        font-weight: 600;
        margin-left: 2px;
    }
    .cell-new {
        background: #cce5ff;
        color: #004085;
    }
    .cell-new small {
        color: #004085;
    }
    .cell-gone {
        background: #f8d7da;
        color: #721c24;
        text-decoration: line-through;
        opacity: 0.85;
    }
    .cell-gone small {
        color: #721c24;
        text-decoration: none;
    }
    .cell-frequent {
        background: #fff3cd;
        color: #856404;
    }
    .cell-frequent small {
        color: #856404;
    }
    .token-panel-placeholder {
        color: #999;
        font-style: italic;
        font-size: 13px;
    }
    .unpin-btn {
        margin-left: 8px;
        font-size: 11px;
        padding: 1px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: #f8f8f8;
        color: #666;
        cursor: pointer;
    }
    .unpin-btn:hover {
        background: #eee;
    }
    .pin-hint {
        margin-left: 8px;
        font-size: 11px;
        color: #999;
        font-weight: normal;
        font-style: italic;
    }
</style>
