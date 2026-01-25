<script lang="ts">
  import { base } from '$app/paths';
  import Menu from "./Nav.Menu.svelte";
  import { Menu as MenuIcon } from "@lucide/svelte";

  let isMenuOpen = $state(false);
  let menuButtonRef: HTMLButtonElement | undefined;
  
  function closeMenu(skipFocus = false) {
    isMenuOpen = false;
    if (!skipFocus) menuButtonRef?.focus();
  }
</script>


<header class="header">
  <div class="header-inner">
    <div class="header-left"></div>

    <a href="{base}/" class="title-link">
      <img src="/jso-scaffold.svg" alt="jso.cool" class="site-logo site-logo-light" />
      <img src="/jso-scaffold-dark.svg" alt="jso.cool" class="site-logo site-logo-dark" />
    </a>

    <div class="header-right">
      <a href="{base}/about" class="about-button">About</a>

      <a href="https://github.com/Vermont-Complex-Systems/website-template" target="_blank" rel="noopener noreferrer" class="github-button" aria-label="View on GitHub">
        <svg viewBox="0 0 16 16" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </a>

      <button
        onclick={() => isMenuOpen = !isMenuOpen}
        bind:this={menuButtonRef}
        class="icon-button mobile-menu-button"
      >
        <MenuIcon size={28} />
        <span class="sr-only">Open menu</span>
      </button>
    </div>
  </div>
</header>

<Menu visible={isMenuOpen} close={closeMenu} />

<style>
  .header {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    background: var(--theme-bg, var(--color-bg));
    z-index: 100;
    transition: border-color 200ms ease, background 200ms ease;
  }


  /* Inner container aligns nav content with page */
  .header-inner {
    width: 100%;
    max-width: var(--page-max-width);
    margin-inline: auto;
    padding-inline: var(--page-padding);

    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--nav-height);
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .header-left {
    gap: 3rem;
  }

  .header-right {
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .title-link {
    text-decoration: none;
    color: inherit;
    transition: transform var(--transition-medium);
  }

  .title-link:hover {
    transform: translateY(-0.125rem);
  }

  .site-logo {
    height: 7.5rem;
    margin-top: 10.5rem;
    width: auto;
    /* box-shadow: -0.25rem 0 1.5rem rgba(0, 0, 0, 0.3); */
  }

  .site-logo-dark {
    display: none;
  }

  :global(body:has(.theme-dark)) .site-logo-light {
    display: none;
  }

  :global(body:has(.theme-dark)) .site-logo-dark {
    display: block;
  }

  .about-button {
    padding: 0.5rem 1rem;
    font-family: "DM Sans", sans-serif;
    font-size: 1.3rem;
    color: var(--color-fg);
    text-decoration: none;
    background: transparent;
    border: none;
    transition: color 200ms ease;
  }

  .about-button:hover {
    color: var(--color-gray-600);
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--color-fg);
    border: none;
    cursor: pointer;
    transition: all var(--transition-medium);
  }

  .icon-button:hover {
    transform: rotate(var(--right-tilt)) scale(1.05);
    background: rgba(0, 0, 0, 0.05);
  }

  .mobile-menu-button {
    display: none;
  }

  .github-button {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: var(--color-fg);
    transition: transform var(--transition-medium);
  }

  .github-button:hover {
    transform: scale(1.1);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Mobile adjustments */
  @media (max-width: 960px) {
    .mobile-menu-button {
      display: flex;
    }
  }

  @media (max-width: 768px) {
    .header-inner {
      padding-inline: var(--page-padding);
    }

    .header-left {
      gap: 0;
    }

    .about-button {
      display: none;
    }

    .icon-button {
      width: 3.5rem;
      height: 3.5rem;
    }
  }
</style>
