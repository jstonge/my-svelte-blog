<script>
    let { revision, tokenDiff, mouseX, mouseY } = $props();
</script>

{#if revision}
    <div class="tooltip" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
        <div class="tooltip-header">
            <strong>Rev {revision.revision_idx}:</strong> {revision.name}
        </div>
        <div class="tooltip-meta">
            <span class="tooltip-date">{new Date(revision.date_modified).toLocaleString()}</span>
            {#if revision.revision_comment}
                <span class="tooltip-comment">{revision.revision_comment}</span>
            {/if}
        </div>
        <div class="tooltip-stats">
            tokens: {revision.total_tokens}
            {#if revision.revision_idx > 1}
                <span class={revision.token_diff >= 0 ? 'positive' : 'negative'}>
                    ({revision.token_diff >= 0 ? '+' : ''}{revision.token_diff})
                </span>
            {/if}
        </div>
        {#if revision.categories?.length > 0}
            <div class="tooltip-categories">
                {#each revision.categories as cat}
                    <span class="tooltip-cat">{cat.replace('Category:', '')}</span>
                {/each}
            </div>
        {/if}
        {#if tokenDiff.added.length > 0 || tokenDiff.removed.length > 0}
            <div class="tooltip-diff">
                {#each tokenDiff.added as { token, diff: d }}
                    <span class="token-added">{token} (+{d})</span>
                {/each}
                {#each tokenDiff.removed as { token, diff: d }}
                    <span class="token-removed">{token} ({d})</span>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .tooltip {
        position: fixed;
        pointer-events: none;
        z-index: 1000;
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 12px;
        max-width: 600px;
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
</style>
