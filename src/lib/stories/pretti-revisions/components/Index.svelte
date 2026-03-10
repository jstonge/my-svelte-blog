<script>
    import { Plot, Line, Dot, RuleX, RuleY, AxisX, AxisY, Text } from 'svelteplot';

    import { getRevisions, listArticles } from '../api.remote.js';
    import RevisionTooltip from './RevisionTooltip.svelte';
    import TokenPanel from './TokenPanel.svelte';
    import DeltaChart from './DeltaChart.svelte';

    let articles = $state([]);
    let revisions = $state([]);
    let loading = $state(true);
    let error = $state(null);

    let identifier = $state('82203651');
    let searchQuery = $state('');
    let searchFocused = $state(false);

    let filteredArticles = $derived(
        searchQuery.trim()
            ? articles.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : articles
    );

    let hoveredRevision = $state(null);
    let pinnedRevision = $state(null);
    let xMode = $state('time'); // 'time' | 'index'
    let xField = $derived(xMode === 'time' ? 'date' : 'revision_idx');

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

    function selectArticle(article) {
        identifier = String(article.identifier);
        searchQuery = '';
        searchFocused = false;
        loadRevisions(identifier);
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

    // Parse dates for time-based x-axis
    let datedRevisions = $derived(
        revisions.map(r => ({ ...r, date: new Date(r.date_modified) }))
    );

    // Brush state for bottom chart → filters top chart
    let brush = $state({ x1: null, x2: null, enabled: true });
    let fullDomain = $derived(
        datedRevisions.length > 0
            ? xMode === 'time'
                ? [datedRevisions[0].date, datedRevisions[datedRevisions.length - 1].date]
                : [1, datedRevisions.length]
            : xMode === 'time' ? [new Date(), new Date()] : [1, 1]
    );

    $effect(() => {
        if (datedRevisions.length > 0) {
            const endIdx = Math.min(99, datedRevisions.length - 1);
            if (xMode === 'time') {
                brush = { x1: datedRevisions[0].date, x2: datedRevisions[endIdx].date, enabled: true };
            } else {
                brush = { x1: 1, x2: endIdx + 1, enabled: true };
            }
        }
    });

    let topDomain = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? [brush.x1, brush.x2]
            : fullDomain
    );

    let filteredRevisions = $derived(
        brush.enabled && brush.x1 != null && brush.x2 != null
            ? xMode === 'time'
                ? datedRevisions.filter(r => r.date >= brush.x1 && r.date <= brush.x2)
                : datedRevisions.filter(r => r.revision_idx >= brush.x1 && r.revision_idx <= brush.x2)
            : datedRevisions
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
        for (const rev of datedRevisions) {
            if (prevName && rev.name !== prevName) {
                changes.push({ date: rev.date, revision_idx: rev.revision_idx, from: prevName, to: rev.name });
            }
            prevName = rev.name;
        }
        return changes;
    });

    const MARGIN = { left: 55, right: 15, top: 30, bottom: 30 };
    let lineChartEl = $state(null);

    function handleChartMouseMove(e) {
        if (!lineChartEl || filteredRevisions.length === 0) return;
        const svg = lineChartEl.querySelector('svg');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();

        const plotLeft = rect.left + MARGIN.left;
        const plotRight = rect.right - MARGIN.right;
        const plotWidth = plotRight - plotLeft;
        if (plotWidth <= 0) return;

        const frac = Math.max(0, Math.min(1, (e.clientX - plotLeft) / plotWidth));

        let bestIdx = 0;
        if (xMode === 'time') {
            const t0 = topDomain[0].getTime();
            const t1 = topDomain[1].getTime();
            const targetTime = t0 + frac * (t1 - t0);
            let bestDist = Infinity;
            for (let i = 0; i < filteredRevisions.length; i++) {
                const dist = Math.abs(filteredRevisions[i].date.getTime() - targetTime);
                if (dist < bestDist) { bestDist = dist; bestIdx = i; }
            }
        } else {
            const idx0 = topDomain[0];
            const idx1 = topDomain[1];
            const targetIdx = idx0 + frac * (idx1 - idx0);
            let bestDist = Infinity;
            for (let i = 0; i < filteredRevisions.length; i++) {
                const dist = Math.abs(filteredRevisions[i].revision_idx - targetIdx);
                if (dist < bestDist) { bestDist = dist; bestIdx = i; }
            }
        }
        hoveredRevision = filteredRevisions[bestIdx];
        mouseX = e.clientX;
        mouseY = e.clientY;
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
        <div class="search-wrapper">
            <input
                type="text"
                placeholder="Search articles..."
                bind:value={searchQuery}
                onfocus={() => searchFocused = true}
                onblur={() => setTimeout(() => searchFocused = false, 150)}
            />
            {#if searchFocused && filteredArticles.length > 0}
                <ul class="search-results">
                    {#each filteredArticles as article}
                        <li>
                            <button onmousedown={() => selectArticle(article)}>
                                {article.name} <span class="rev-count">({article.revision_count} revisions)</span>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </label>
</div>

{#if error}
    <p class="status error">Error: {error?.message ?? 'Unknown error'}</p>
{/if}

<div class="layout">
    <div class="charts-col">
        <div class="x-mode-toggle">
            <span class="toggle-label">x-axis</span>
            <button class:active={xMode === 'time'} onclick={() => xMode = 'time'}>Time</button>
            <button class:active={xMode === 'index'} onclick={() => xMode = 'index'}>Revision #</button>
        </div>
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
                x={{ label: false, domain: topDomain }}
                y={{ grid: true }}
            >
                <Dot
                    data={filteredRevisions}
                    x={xField}
                    y="total_tokens"
                    fill="steelblue"
                    r={3}
                />
                {#if pinnedRevision}
                    <Dot
                        data={[pinnedRevision]}
                        x={xField}
                        y="total_tokens"
                        fill="orange"
                        stroke="white"
                        strokeWidth={2}
                        r={6}
                        style="pointer-events: none"
                    />
                {/if}
                {#if hoveredRevision}
                    <RuleX
                        data={[{ x: xMode === 'time' ? hoveredRevision.date : hoveredRevision.revision_idx }]}
                        x="x"
                        stroke="#999"
                        strokeWidth={0.5}
                        strokeDasharray="3 2"
                        style="pointer-events: none"
                    />
                    <RuleY
                        data={[{ y: hoveredRevision.total_tokens }]}
                        y="y"
                        stroke="#999"
                        strokeWidth={0.5}
                        strokeDasharray="3 2"
                        style="pointer-events: none"
                    />
                {/if}
                {#if hoveredRevision && (!pinnedRevision || hoveredRevision.revision_idx !== pinnedRevision.revision_idx)}
                    <Dot
                        data={[hoveredRevision]}
                        x={xField}
                        y="total_tokens"
                        fill="orange"
                        stroke="white"
                        strokeWidth={2}
                        r={5}
                        opacity={0.6}
                        style="pointer-events: none"
                    />
                {/if}
                {#each titleChanges.filter(d => xMode === 'time' ? d.date >= topDomain[0] && d.date <= topDomain[1] : d.revision_idx >= topDomain[0] && d.revision_idx <= topDomain[1]) as tc}
                    <RuleX
                        data={[{ x: xMode === 'time' ? tc.date : tc.revision_idx }]}
                        x="x"
                        stroke="#999"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        style="pointer-events: none"
                    />
                    <Text
                        data={[{ x: xMode === 'time' ? tc.date : tc.revision_idx, text: tc.to }]}
                        x="x"
                        text="text"
                        frameAnchor="top"
                        textAnchor="start"
                        dx={4}
                        dy={4}
                        fontSize={10}
                        fill="#666"
                    />
                {/each}
                <RuleY y={0} stroke="black" />
                <RuleX x={topDomain[0]} stroke="black" />
                <AxisX />
                <AxisY title="total_tokens" />
            </Plot>
            </div>

            <DeltaChart
                revisions={datedRevisions}
                {fullDomain}
                margin={MARGIN}
                {titleChanges}
                {xField}
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
    .search-wrapper {
        position: relative;
    }
    .search-wrapper input {
        padding: 0.4rem 0.6rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.9rem;
        min-width: 20rem;
    }
    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin: 2px 0 0;
        padding: 0;
        list-style: none;
        max-height: 250px;
        overflow-y: auto;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .search-results button {
        display: block;
        width: 100%;
        padding: 0.4rem 0.6rem;
        border: none;
        background: none;
        text-align: left;
        font-size: 0.85rem;
        cursor: pointer;
    }
    .search-results button:hover {
        background: #f0f0f0;
    }
    .rev-count {
        color: #999;
        font-size: 0.75rem;
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
    .x-mode-toggle {
        display: flex;
        align-items: center;
        gap: 0;
        justify-content: flex-end;
        margin-bottom: 0.3rem;
    }
    .toggle-label {
        font-size: 11px;
        color: #666;
        margin-right: 6px;
    }
    .x-mode-toggle button {
        font-size: 12px;
        padding: 3px 10px;
        border: 1px solid #ccc;
        background: #f8f8f8;
        color: #666;
        cursor: pointer;
        margin-right: -1px;
    }
    .x-mode-toggle button:first-child {
        border-radius: 4px 0 0 4px;
    }
    .x-mode-toggle button:last-child {
        border-radius: 0 4px 4px 0;
    }
    .x-mode-toggle button.active {
        background: #333;
        color: white;
        border-color: #333;
        z-index: 1;
        position: relative;
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
