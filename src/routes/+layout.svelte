<script>
	import Nav from '$lib/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import '$styles/app.css';

	let { children } = $props();

	let navVariant = $derived(page.url.pathname.startsWith('/about') ? 'left' : 'centered');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.jpg" />
	<script async defer src="https://cloud.umami.is/script.js" data-website-id="44b340b0-d307-4438-8fb4-4e17f1767354"></script>
</svelte:head>

<Nav variant={navVariant} />

<ModeWatcher defaultMode="light" />

<main id="content">
	{@render children?.()}
</main>