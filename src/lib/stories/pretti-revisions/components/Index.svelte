<script>
    import { Plot, Line, Dot, RuleX, AxisY, Text } from 'svelteplot';

    import unigramData from '../data/test-unigrams-2026-01-25_82203651.json';
    import bigramData from '../data/test-bigrams-2026-01-25_82203651.json';
    import RevisionTooltip from './RevisionTooltip.svelte';
    import TokenPanel from './TokenPanel.svelte';
    import DeltaChart from './DeltaChart.svelte';

    const datasets = { unigrams: unigramData, bigrams: bigramData };
    let ngram = $state('bigrams');

    // Prepare chart data with token diffs
    let revisions = $derived(
        datasets[ngram].revision_history.map((rev, i, arr) => ({
            ...rev,
            token_diff: i === 0 ? 0 : rev.total_tokens - arr[i - 1].total_tokens,
        }))
    );

    // Precompute all token-level diffs (avoids recomputing on every hover)
    let tokenDiffs = $derived(revisions.map((rev, i) => {
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
    }));

    // Precompute first revision index where each token appears
    let firstSeen = $derived.by(() => {
        const map = new Map();
        for (const rev of revisions) {
            for (const token of Object.keys(rev.tokens)) {
                if (!map.has(token)) map.set(token, rev.revision_idx);
            }
        }
        return map;
    });

    // Brush state for bottom chart → filters top chart (start with first 100)
    let brush = $state({ x1: 1, x2: 100, enabled: true });
    let fullDomain = $derived([1, revisions.length]);

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

    // Reset pinned revision when switching ngram type
    $effect(() => { ngram; pinnedRevision = null; hoveredRevision = null; });

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

    // Annotations: title change + day boundaries
    const TITLE_CHANGE_REV = 160;

    // Compute day boundaries from date_modified
    let dayBoundaries = $derived.by(() => {
        const boundaries = [];
        let prevDay = null;
        for (const rev of revisions) {
            const day = rev.date_modified?.slice(0, 10);
            if (day && day !== prevDay) {
                if (prevDay) boundaries.push({ rev: rev.revision_idx, day });
                prevDay = day;
            }
        }
        return boundaries;
    });

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

<h3 class="page-title">
    <a href="https://en.wikipedia.org/wiki/Killing_of_Alex_Pretti">Killing of Alex Pretti</a> — {revisions.length} revisions
    <select class="ngram-select" bind:value={ngram}>
        <option value="unigrams">Unigrams</option>
        <option value="bigrams">Bigrams</option>
    </select>
</h3>

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
            {#if TITLE_CHANGE_REV >= topDomain[0] && TITLE_CHANGE_REV <= topDomain[1]}
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
            {/if}
            {#each dayBoundaries.filter(d => d.rev >= topDomain[0] && d.rev <= topDomain[1]) as { rev, day }}
                <RuleX
                    data={[{ x: rev }]}
                    x="x"
                    stroke="#b07d2b"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    style="pointer-events: none"
                />
                <Text
                    data={[{ x: rev + 2, text: day }]}
                    x="x"
                    text="text"
                    frameAnchor="top"
                    textAnchor="start"
                    dy={18}
                    fontSize={9}
                    fill="#b07d2b"
                />
            {/each}
            <AxisY title="total_tokens" />
        </Plot>
        </div>

        <DeltaChart
            {revisions}
            {fullDomain}
            margin={MARGIN}
            titleChangeRev={TITLE_CHANGE_REV}
            {dayBoundaries}
            bind:brush
        />
    </div>

    <TokenPanel
        {panelRevision}
        {pinnedRevision}
        {panelMode}
        {panelTokenList}
        {modeInfo}
        onunpin={() => pinnedRevision = null}
        onmodechange={(mode) => panelMode = mode}
    />
</div>

<RevisionTooltip
    revision={hoveredRevision}
    tokenDiff={tokenDiff}
    {mouseX}
    {mouseY}
/>

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
    .ngram-select {
        font-size: 13px;
        padding: 2px 6px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #f8f8f8;
        color: #333;
        margin-left: 8px;
        vertical-align: middle;
        cursor: pointer;
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
</style>
