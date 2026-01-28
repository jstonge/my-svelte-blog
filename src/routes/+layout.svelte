<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import '$styles/app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();

	let navVariant: 'left' | 'centered' = $derived(page.url.pathname.startsWith('/about') ? 'left' : 'centered');
</script>

<Nav variant={navVariant} />

<ModeWatcher defaultMode="light" />

<main id="content">
	{@render children?.()}
</main>