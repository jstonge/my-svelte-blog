<script lang="ts">
    import type { Story } from '$lib/data.remote';

    let { stories }: { stories: Story[] } = $props();
</script>

<div class="story-grid">
    {#each stories as story (story.slug)}
        <a href="/{story.slug}" class="story-card">
            <div class="card-content">
                <h3>{story.title}</h3>
                <p class="description">{story.description}</p>
                {#if story.tags}
                    <div class="tags">
                        {#each story.tags.split(',').map(t => t.trim()).filter(Boolean) as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                {/if}
                <div class="card-footer">
                    <p class="date">{story.date}</p>
                    <span class="read-more">Read more →</span>
                </div>
            </div>
        </a>
    {/each}
</div>

<style>
    .story-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin: 2rem 0;
    }

    .story-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 280px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
    }

    .story-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 1);
        border-color: rgba(0, 0, 0, 0.12);
    }

    .card-content {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1rem;
    }

    .card-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .read-more {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-primary, #007a87);
        transition: transform 0.2s ease;
    }

    .story-card:hover .read-more {
        transform: translateX(4px);
    }

    .description {
        font-size: 1rem;
        line-height: 1.6;
        color: rgba(0, 0, 0, 0.7);
        flex-grow: 1;
    }

    .date {
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.5);
        font-family: var(--sans);
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        font-size: 0.75rem;
        font-family: var(--sans);
        padding: 0.25rem 0.6rem;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 12px;
        color: rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 768px) {
        .story-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .story-card {
            min-height: 220px;
        }

        .card-content {
            padding: 1.5rem;
        }
    }
</style>
