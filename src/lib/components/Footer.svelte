<script lang="ts">
	import { base } from '$app/paths';
	import { Youtube, Github, Linkedin, MessageCircle, ExternalLink } from "@lucide/svelte";
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-logo">
			<img src="{base}/UVM_Logo_Primary_Horiz_W_PunchOut.png" alt="Logo" class="logo-img" />
			<ul class="social-icons">
				<li>
					<a href="https://www.youtube.com/@UVMcomplexity" target="_blank" rel="noreferrer" aria-label="YouTube">
						<Youtube class="icon" size={20} />
					</a>
				</li>
				<li>
					<a href="https://github.com/Vermont-complex-systems" target="_blank" rel="noreferrer" aria-label="GitHub">
						<Github class="icon" size={20} />
					</a>
				</li>
				<li>
					<a href="https://bsky.app/profile/vcsi.bsky.social" target="_blank" rel="noreferrer" aria-label="Bluesky">
						<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
						</svg>
					</a>
				</li>
				<li>
					<a href="https://linkedin.com/school/uvm-vcsc/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
						<Linkedin class="icon" size={20} />
					</a>
				</li>
			</ul>
		</div>

		<div class="footer-bottom">
			<a class="cc-footer-copy" href="https://www.uvm.edu/equal-opportunity/americans-disabilities-act-and-reasonable-accommodations" target="_blank" rel="noreferrer">
				<span class="link-text">Accessibility <ExternalLink class="icon" size={14} /></span>
			</a>
			<a class="cc-footer-copy" href="https://www.uvm.edu/compliance/website-privacy-policy/terms-use" target="_blank" rel="noreferrer">
				<span class="privacy-text">Privacy/Terms of Use <ExternalLink class="icon" size={14} /></span>
			</a>
			<div class="cc-footer-copy">© 2026, TODO</div>
		</div>
	</div>
</footer>

<style>
		.footer {
		width: 100%;
		background-color: var(--color-uvm-green);
		border-top: 1px solid var(--color-border);
		padding: 3rem 0 2rem; /* vertical padding only */
		margin-top: 4rem;
	}

	:global(.dark) .footer {
		background-color: var(--color-gray-800);
		border-top-color: var(--color-gray-700);
	}

	/* Inner container aligns content with header/main page */
	.footer-inner {
		width: 100%;
		max-width: var(--page-max-width);
		margin-inline: auto;
		padding-inline: var(--page-padding);

		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2rem;
		align-items: start;
	}

	.footer-logo {
		grid-column: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.logo-img {
		width: 200px;
		height: auto;
	}

	.footer-bottom {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: nowrap;
		gap: 1.5rem;
		align-items: center;
		padding-top: 1.5rem;
		margin-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.dark) .footer-bottom {
		border-top-color: var(--color-gray-700);
	}

	.social-icons {
		display: flex;
		gap: 1rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.social-icons a {
		text-decoration: none;
		color: var(--color-uvm-gold);
	}

	.cc-footer-copy {
		color: var(--color-white);
		font-weight: 500;
		font-size: 1rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.cc-footer-copy .link-text,
	.cc-footer-copy .privacy-text {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.cc-footer-copy:last-child {
		margin-left: auto;
	}

	@media (max-width: 768px) {
		.footer-inner {
			grid-template-columns: repeat(2, 1fr);
			grid-template-rows: auto auto auto;
			gap: 1.5rem 1rem;
		}

		.footer-logo {
			grid-column: 1 / 3;
			grid-row: 1;
			gap: 0.75rem;
		}

		.footer-bottom {
			grid-column: 1 / 3;
			grid-row: 2;
			flex-wrap: wrap;
			gap: 1rem;
		}

		.cc-footer-copy {
			font-size: 0.85rem;
		}

		.cc-footer-copy:last-child {
			width: 100%;
			margin-left: 0;
		}
	}

</style>