<script lang="ts">
	import { base } from "$app/paths";
	import { afterNavigate } from "$app/navigation";
	import { X, Youtube, Github, Linkedin, ChevronDown, ChevronUp, ExternalLink } from "@lucide/svelte";

	let { visible, close } = $props();

	let mainEl: HTMLElement | null | undefined;
	let closeBtnEl: HTMLButtonElement | undefined;
	let isWhoWeAreOpen = $state(false);
	let isResearchOpen = $state(false);
	let isEducationOpen = $state(false);

	export const open = () => {
		closeBtnEl?.focus();
		mainEl?.setAttribute("aria-hidden", "true");
	};

	const onClose = (e?: Event | string) => {
		if (e && typeof e !== "string" && e instanceof KeyboardEvent && e.type === "keyup" && e.key !== "Escape") return;
		mainEl?.removeAttribute("aria-hidden");
		close(e === "skip");
	};

	$effect(() => {
		mainEl = document.querySelector("main");
	});

	afterNavigate(() => onClose("skip"));
</script>

<svelte:window on:keyup={onClose} />

<nav id="nav-menu" class:visible aria-hidden={!visible}>
	<div class="nav-content">
		<button 
			class="btn-close" 
			aria-label="close menu" 
			bind:this={closeBtnEl} 
			onclick={onClose}
		>
			<X class="icon" size={20} />
		</button>
		
		<div class="nav-links">
			<ul>				
				<li>
					<a href="{base}/about" rel="noopener noreferrer">
						About
					</a>
				</li>
			</ul>
		</div>
	</div>
</nav>

<style>
	/* Menu container - slides in from right */
	nav {
		position: fixed;
		top: 0;
		right: 0;
		width: 100%;
		max-width: min(17.5rem, 85vw);
		height: 100svh;
		z-index: calc(var(--z-overlay) + 1);
		visibility: hidden;
		transform: translateX(100%);
		transition: transform var(--transition-medium);
		overflow-y: auto;
		/* Light mode: dark menu */
		background: var(--color-gray-900);
		color: var(--color-gray-100);
		border-left: 1px solid var(--color-gray-700);
		box-shadow: -0.25rem 0 1.5rem rgba(0, 0, 0, 0.3);
	}

	/* Dark mode: light menu */
	:global(.dark) nav {
		background: var(--color-gray-200);
		color: var(--color-gray-800);
		border-left: 1px solid var(--color-gray-300);
		box-shadow: -0.25rem 0 1.5rem rgba(0, 0, 0, 0.2);
	}

	nav.visible {
		visibility: visible;
		transform: translateX(0);
	}

	.nav-content {
		padding: 2rem 1.5rem;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* Close button */
	.btn-close {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--color-gray-700);
		border-radius: 0.5rem;
		background: transparent;
		color: var(--color-gray-100);
		margin-bottom: 2rem;
		padding: 0;
		cursor: pointer;
		transition: all var(--transition-medium);
	}

	.btn-close:hover {
		background: var(--color-gray-800);
		transform: rotate(var(--right-tilt)) scale(1.05);
	}

	:global(.dark) .btn-close {
		border-color: var(--color-gray-400);
		color: var(--color-gray-800);
	}

	:global(.dark) .btn-close:hover {
		background: var(--color-gray-300);
	}

	/* Menu sections */
	.nav-links {
		margin-bottom: 2rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin-bottom: 0.75rem;
	}

	/* Links */
	a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		font-family: var(--sans);
		font-size: var(--font-size-medium);
		font-weight: 500;
		color: var(--color-gray-100);
		text-decoration: none;
		transition: all var(--transition-medium);
	}

	a:hover {
		color: var(--color-white);
		transform: translateX(0.25rem);
	}

	:global(.dark) a {
		color: var(--color-gray-800);
	}

	:global(.dark) a:hover {
		color: var(--color-gray-900);
	}
</style>