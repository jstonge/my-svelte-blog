<script>
    let { command, label = '' } = $props();
    let copied = $state(false);

    async function copyCommand() {
        await navigator.clipboard.writeText(command);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
</script>

<div class="code-block-wrapper">
    {#if label}
        <span class="code-label">{label}</span>
    {/if}
    <div class="code-block">
        <code>{command}</code>
        <button class="copy-btn" onclick={copyCommand} aria-label="Copy command">
            {#if copied}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            {/if}
        </button>
    </div>
</div>

<style>
    .code-block-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .code-label {
        font-size: 0.8rem;
        font-family: var(--sans);
        color: var(--color-gray-700);
        font-weight: 500;
    }

    .code-block {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-family: var(--mono);
        font-size: 0.85rem;
        max-width: fit-content;
    }

    .code-block code {
        color: var(--color-fg);
    }

    .copy-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--color-fg);
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .copy-btn:hover {
        opacity: 1;
    }
</style>
