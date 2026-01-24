<script lang="ts">
  let {
    title,
    subtitle,
    authors,
    date,
    class: className = ''
  } = $props();
</script>

<header class={`story-header prose ${className}`}>
  <h1>{title}</h1>

  {#if subtitle}
    <h2>{subtitle}</h2>
  {/if}

  <div class="article-meta">
    {#if authors}
      <p class="author">
        By
        {#each authors as author, i}
          <a
            target="_blank"
            rel="noreferrer"
            href={author.url}
          >
            {author.name}
          </a>
          {#if i < authors.length - 1}
            {i === authors.length - 2 ? ' and ' : ', '}
          {/if}
        {/each}
      </p>
    {/if}

    {#if date}
      <p class="date">{date}</p>
    {/if}
  </div>
</header>

<style>
.story-header {
  margin-bottom: 5rem;
  text-align: center;
}

.story-header h1 {
  font-size: var(--font-size-giant);
  padding-top: 4rem;
}

.story-header h2 {
  font-size: var(--font-size-medium);
  font-weight: 400;
}

.article-meta {
  margin: -1rem auto 2rem auto;
  text-align: center;
}

.article-meta .author a {
  color: var(--color-gray-900);
}

.article-meta .date {
  font-size: var(--font-size-small);
  color: var(--color-tertiary-gray);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .story-header h1 {
    font-size: 4rem;
  }

  .story-header h2 {
    font-size: 2rem;
  }
}
</style>
