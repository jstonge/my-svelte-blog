<script lang="ts">
	import { ArrowDown } from '@lucide/svelte';

	let { threshold = 100 }: { threshold?: number } = $props();

	let scrollY = $state(0);
	let visible = $derived(scrollY < threshold);
</script>

<svelte:window bind:scrollY />

{#if visible}
	<div class="scroll-indicator">
		<ArrowDown size={32} strokeWidth={2} />
	</div>
{/if}

<style>
	.scroll-indicator {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		opacity: 0.7;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateX(-50%) translateY(0);
		}
		50% {
			transform: translateX(-50%) translateY(-10px);
		}
	}
</style>
