<script>
    let { panelRevision, pinnedRevision, panelMode, panelTokenList, modeInfo, onunpin, onmodechange } = $props();
</script>

<div class="token-panel">
    <div class="panel-controls">
        <div class="mode-selector">
            <button class:active={panelMode === 'diff'} onclick={() => onmodechange('diff')}>Diff</button>
            <button class:active={panelMode === 'first-seen'} onclick={() => onmodechange('first-seen')}>First seen</button>
            <button class:active={panelMode === 'frequency'} onclick={() => onmodechange('frequency')}>Frequency</button>
        </div>
        {#if pinnedRevision}
            <button class="unpin-btn" onclick={onunpin}>unpin</button>
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

<style>
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
