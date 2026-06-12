<script lang="ts">
import { browser } from '$app/environment';
import { generateFingerprint } from '$lib/utils/browserFingerprint.js';
import StoryHeader from '$lib/components/StoryHeader.svelte';
import { saveAnswer as saveAnswerRemote, getSurveyResponse } from '../data/survey.remote.js';

let { data } = $props();

let fingerprint = $state('');

// Question 1: single-choice radio
let selectedCombination = $state('');
// Question 2: free text
let why = $state('');
// Track last saved value for the textarea to avoid redundant saves
let lastSavedWhy = $state('');

type SaveStatus = '' | 'saving' | 'saved' | 'error';
let combinationStatus = $state<SaveStatus>('');
let whyStatus = $state<SaveStatus>('');

let combinationTimer: ReturnType<typeof setTimeout> | undefined;
let whyTimer: ReturnType<typeof setTimeout> | undefined;

const statusLabel = (s: SaveStatus) =>
	s === 'saving' ? 'Saving…' : s === 'saved' ? 'Saved ✓' : s === 'error' ? 'Error ✗' : '';

// On mount (browser only): generate fingerprint and prefill from any stored response.
$effect(() => {
	if (!browser) return;

	let cancelled = false;

	(async () => {
		try {
			const fp = await generateFingerprint();
			if (cancelled) return;
			fingerprint = fp;

			const existing = await getSurveyResponse(fp);
			if (cancelled || !existing) return;

			selectedCombination = existing.preferredCombination ?? '';
			why = existing.why ?? '';
			lastSavedWhy = why;
		} catch (err) {
			console.error('Failed to load survey response:', err);
		}
	})();

	return () => {
		cancelled = true;
	};
});

$effect(() => {
	return () => {
		clearTimeout(combinationTimer);
		clearTimeout(whyTimer);
	};
});

async function saveCombination() {
	if (!fingerprint) return;
	clearTimeout(combinationTimer);
	combinationStatus = 'saving';
	try {
		await saveAnswerRemote({
			fingerprint,
			field: 'preferredCombination',
			value: selectedCombination
		});
		combinationStatus = 'saved';
	} catch (err) {
		console.error('Failed to save preferredCombination:', err);
		combinationStatus = 'error';
	}
	combinationTimer = setTimeout(() => {
		combinationStatus = '';
	}, 2000);
}

async function saveWhy() {
	if (!fingerprint) return;
	if (why === lastSavedWhy) return;

	clearTimeout(whyTimer);
	whyStatus = 'saving';
	try {
		await saveAnswerRemote({ fingerprint, field: 'why', value: why });
		lastSavedWhy = why;
		whyStatus = 'saved';
	} catch (err) {
		console.error('Failed to save why:', err);
		whyStatus = 'error';
	}
	whyTimer = setTimeout(() => {
		whyStatus = '';
	}, 2000);
}
</script>

<article class="story" id="ic2s2-survey">
	<StoryHeader
		title={data.title}
		subtitle={data.subtitle}
		authors={data.authors}
		date={data.date}
	/>

	<div class="container">
		<p class="intro">{data.intro}</p>

		<section class="question">
			<div class="question-head">
				<h3>{data.combinationQuestion}</h3>
				{#if combinationStatus}
					<span class="status status-{combinationStatus}">
						{statusLabel(combinationStatus)}
					</span>
				{/if}
			</div>

			<div class="options" role="radiogroup">
				{#each data.combinationOptions as option (option.value)}
					<label class="option" class:selected={selectedCombination === option.value}>
						<input
							type="radio"
							name="preferredCombination"
							value={option.value}
							bind:group={selectedCombination}
							onchange={saveCombination}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		</section>

		<section class="question">
			<div class="question-head">
				<h3>{data.whyQuestion}</h3>
				{#if whyStatus}
					<span class="status status-{whyStatus}">
						{statusLabel(whyStatus)}
					</span>
				{/if}
			</div>

			<textarea
				bind:value={why}
				placeholder={data.whyPlaceholder}
				onblur={saveWhy}
				rows="5"
			></textarea>
		</section>
	</div>
</article>

<style>
.story {
	background: #ffffff;
	color: #1a1a1a;
}

.container {
	max-width: 640px;
	margin: 0 auto;
	padding: 0 1.25rem 4rem;
}

.intro {
	font-size: 1.05rem;
	line-height: 1.6;
	margin-bottom: 2.5rem;
}

.question {
	margin-bottom: 2.75rem;
}

.question-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-bottom: 1rem;
}

.question-head h3 {
	font-size: 1.2rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0;
}

.status {
	font-size: 0.8rem;
	white-space: nowrap;
	flex-shrink: 0;
}

.status-saving {
	color: #6b7280;
}

.status-saved {
	color: #16a34a;
}

.status-error {
	color: #dc2626;
}

.options {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}

.option {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.85rem 1rem;
	border: 1px solid #d4d4d8;
	border-radius: 10px;
	cursor: pointer;
	font-size: 1rem;
	transition:
		border-color 150ms ease,
		background-color 150ms ease;
	min-height: 48px;
}

.option:hover {
	border-color: #9ca3af;
}

.option.selected {
	border-color: #2563eb;
	background: #eff6ff;
}

.option input[type='radio'] {
	width: 1.15rem;
	height: 1.15rem;
	accent-color: #2563eb;
	flex-shrink: 0;
}

textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 0.85rem 1rem;
	border: 1px solid #d4d4d8;
	border-radius: 10px;
	font-family: inherit;
	font-size: 1rem;
	line-height: 1.5;
	resize: vertical;
	color: inherit;
	background: #ffffff;
}

textarea:focus {
	outline: none;
	border-color: #2563eb;
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
</style>
