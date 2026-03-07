<script>
    import { Plot, Line, Dot, RuleX, AxisY, Text } from 'svelteplot';

    import { getRevisions, listArticles } from '../api.remote.js';
    import RevisionTooltip from './RevisionTooltip.svelte';
    import TokenPanel from './TokenPanel.svelte';
    import DeltaChart from './DeltaChart.svelte';

    let articles = $state([]);
    let revisions = $state([]);
    let loading = $state(true);
    let error = $state(null);

    let identifier = $state('82203651');

    let hoveredRevision = $state(null);
    let pinnedRevision = $state(null);

    async function loadRevisions(id) {
        loading = true;
        error = null;
        hoveredRevision = null;
        pinnedRevision = null;
        try {
            revisions = await getRevisions(id);
        } catch (e) {
            error = e;
        } finally {
            loading = false;
        }
    }

    // Initial loads
    listArticles().then(a => articles = a).catch(() => {});
    loadRevisions('82203651');

    function handleSelect(e) {
        const val = e.target.value;
        if (val && val !== identifier) {
            identifier = val;
            loadRevisions(identifier);
        }
    }

    // Reconstruct full token state up to a given revision index (lazy, on demand)
    function getTokensAtRevision(idx) {
        const accumulated = {};
        for (let i = 0; i <= idx; i++) {
            const diff = revisions[i].raw_token_diff;
            for (const [token, count] of Object.entries(diff)) {
                if (count <= 0) {
                    delete accumulated[token];
                } else {
                    accumulated[token] = count;
                }
            }
        }
        return accumulated;
    }

    // Precompute tooltip diffs from raw_token_diff
    let tokenDiffs = $derived(revisions.map((rev) => {
        const diff = rev.raw_token_diff;
        const changes = Object.entries(diff)
            .filter(([, count]) => count !== 0)
            .map(([token, count]) => ({ token, diff: count }));
        return {
            added: changes.filter(d => d.diff > 0),
            removed: changes.filter(d => d.diff < 0),
        };
    }));

    // Precompute first revision index where each token appears
    let firstSeen = $derived.by(() => {
        const map = new Map();
        const accumulated = {};
        for (const rev of revisions) {
            for (const [token, count] of Object.entries(rev.raw_token_diff)) {
                if (count > 0 && !(token in accumulated)) {
                    map.set(token, rev.revision_idx);
                }
                if (count <= 0) {
                    delete accumulated[token];
                } else {
                    accumulated[token] = count;
                }
            }
        }
        return map;
    });

    // Brush state for bottom chart → filters top chart
    let brush = $state({ x1: 1, x2: 100, enabled: true });
    let fullDomain = $derived([1, revisions.length || 1]);

    $effect(() => {
        if (revisions.length > 0) {
            brush = { x1: 1, x2: Math.min(100, revisions.length), enabled: true };
        }
    });

    let topDomain = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? [Math.round(brush.x1), Math.round(brush.x2)]
            : fullDomain
    );

    let filteredRevisions = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? revisions.filter(r => r.revision_idx >= Math.round(brush.x1) && r.revision_idx <= Math.round(brush.x2))
            : revisions
    );

    let tokenDiff = $derived(hoveredRevision ? tokenDiffs[hoveredRevision.revision_idx - 1] : null);

    let panelMode = $state('diff');

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

    let panelRevision = $derived(pinnedRevision ?? hoveredRevision);

    // Token list for the panel — reconstructs full tokens on demand
    let panelTokenList = $derived.by(() => {
        if (!panelRevision) return [];
        const idx = panelRevision.revision_idx - 1;
        const tokens = getTokensAtRevision(idx);
        const entries = Object.entries(tokens);

        if (panelMode === 'diff') {
            const diffMap = new Map();
            const removedTokens = [];
            if (idx > 0) {
                const prev = getTokensAtRevision(idx - 1);
                const allKeys = new Set([...Object.keys(tokens), ...Object.keys(prev)]);
                for (const key of allKeys) {
                    const c = tokens[key] ?? 0;
                    const p = prev[key] ?? 0;
                    if (c !== p) {
                        diffMap.set(key, c - p);
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
            const revIdx = panelRevision.revision_idx;
            return entries
                .filter(([token]) => (firstSeen.get(token) ?? 1) === revIdx)
                .map(([token, count]) => ({ token, count }))
                .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
        }

        return entries
            .map(([token, count]) => ({ token, count, diff: 0, isNew: false, firstRev: 0 }))
            .sort((a, b) => b.count - a.count);
    });

    let mouseX = $state(0);
    let mouseY = $state(0);

    let titleChanges = $derived.by(() => {
        const changes = [];
        let prevName = null;
        for (const rev of revisions) {
            if (prevName && rev.name !== prevName) {
                changes.push({ rev: rev.revision_idx, from: prevName, to: rev.name });
            }
            prevName = rev.name;
        }
        return changes;
    });

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

<h3 class="page-title">WikiEdit Explorer</h3>

<div class="search-bar">
    <label>
        Article
        <select value={identifier} onchange={handleSelect} disabled={articles.length === 0}>
            {#if articles.length === 0}
                <option>Loading articles...</option>
            {:else}
                {#each articles as article}
                    <option value={String(article.identifier)}>
                        {article.name} ({article.revision_count} revisions)
                    </option>
                {/each}
            {/if}
        </select>
    </label>
</div>

{#if error}
    <p class="status error">Error: {error?.message ?? 'Unknown error'}</p>
{/if}

<div class="layout">
    <div class="charts-col">
        {#if loading}
            <div class="chart-placeholder">Loading revisions...</div>
        {:else}
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
            <div
                role="application"
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
                x={{ label: false, domain: topDomain, axis: false }}
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
                {#each titleChanges.filter(d => d.rev >= topDomain[0] && d.rev <= topDomain[1]) as { rev, from, to }}
                    <RuleX
                        data={[{ x: rev }]}
                        x="x"
                        stroke="#999"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        style="pointer-events: none"
                    />
                    <Text
                        data={[{ x: rev - 2, text: `← ${from}` }]}
                        x="x"
                        text="text"
                        frameAnchor="top"
                        textAnchor="end"
                        dy={4}
                        fontSize={10}
                        fill="#666"
                    />
                    <Text
                        data={[{ x: rev + 2, text: `${to} →` }]}
                        x="x"
                        text="text"
                        frameAnchor="top"
                        textAnchor="start"
                        dy={4}
                        fontSize={10}
                        fill="#666"
                    />
                {/each}
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
                titleChanges={titleChanges}
                {dayBoundaries}
                bind:brush
            />
        {/if}
        </div>

        {#if !loading && !error}
            <TokenPanel
                {panelRevision}
                {pinnedRevision}
                {panelMode}
                {panelTokenList}
                {modeInfo}
                onunpin={() => pinnedRevision = null}
                onmodechange={(mode) => panelMode = mode}
            />
        {/if}
    </div>

    {#if !loading && !error}
        <RevisionTooltip
            revision={hoveredRevision}
            tokenDiff={tokenDiff}
            {mouseX}
            {mouseY}
        />
    {/if}

<style>
    :global(#content) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }
    .search-bar {
        text-align: center;
        margin: 1rem 0 0.5rem;
    }
    .search-bar label {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 0.8rem;
        color: #666;
        gap: 0.3rem;
    }
    .search-bar select {
        padding: 0.4rem 0.6rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.9rem;
        min-width: 20rem;
    }
    .page-title {
        text-align: center;
        color: #333;
        margin: 0.5rem 0 0;
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
    .chart-placeholder {
        height: 420px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 0.9rem;
    }
    .status {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    .status.error {
        color: #d62728;
    }
</style>
