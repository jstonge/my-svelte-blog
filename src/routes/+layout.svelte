<script>
	import Nav from '$lib/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import '$styles/app.css';

	let { children } = $props();

	let navVariant = $derived(page.url.pathname.startsWith('/about') ? 'left' : 'centered');
</script>

<Nav variant={navVariant} />

<ModeWatcher defaultMode="light" />

<main id="content">
	{@render children?.()}
</main>