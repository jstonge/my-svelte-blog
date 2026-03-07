import * as v from 'valibot';
import { query } from '$app/server';
import { PUBLIC_API_URL } from '$env/static/public';

interface ApiRevision {
	revision_id: string;
	name: string;
	date_modified: string;
	revision_comment: string;
	categories: string;
	token_diff: string;
}

interface ApiResponse {
	revisions: ApiRevision[];
	duration: number;
}

// Lightweight revision for chart rendering (no full tokens map)
export interface RevisionSummary {
	revision_idx: number;
	revision_id: string;
	name: string;
	date_modified: string;
	revision_comment: string;
	categories: string[];
	total_tokens: number;
	token_diff: number;
	// raw token diff from API — small, only changed tokens
	raw_token_diff: Record<string, number>;
}

export interface ArticleSummary {
	identifier: number;
	name: string;
	revision_count: number;
	first_edit: string;
	last_edit: string;
}

export const listArticles = query(async () => {
	const res = await fetch(`${PUBLIC_API_URL}/datalakes/wikigrams/revisions`);
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const data: { articles: ArticleSummary[] } = await res.json();
	return data.articles;
});

export const getRevisions = query(v.string(), async (identifier) => {
	const res = await fetch(`${PUBLIC_API_URL}/datalakes/wikigrams/revisions/${identifier}`);
	if (!res.ok) throw new Error(`API error: ${res.status}`);

	const data: ApiResponse = await res.json();
	return transformRevisions(data.revisions);
});

function transformRevisions(raw: ApiRevision[]): RevisionSummary[] {
	const revisions: RevisionSummary[] = [];
	let runningTotal = 0;
	// Track accumulated counts only to compute total_tokens
	const accumulated: Record<string, number> = {};

	for (let i = 0; i < raw.length; i++) {
		const rev = raw[i];
		const diff: Record<string, number> = JSON.parse(rev.token_diff || '{}');
		const categories: string[] = JSON.parse(rev.categories || '[]');

		// Update running totals
		let delta = 0;
		for (const [token, newCount] of Object.entries(diff)) {
			const oldCount = accumulated[token] ?? 0;
			delta += newCount - oldCount;
			if (newCount <= 0) {
				delete accumulated[token];
			} else {
				accumulated[token] = newCount;
			}
		}

		runningTotal += delta;

		revisions.push({
			revision_idx: i + 1,
			revision_id: rev.revision_id,
			name: rev.name,
			date_modified: rev.date_modified,
			revision_comment: rev.revision_comment,
			categories,
			total_tokens: runningTotal,
			token_diff: delta,
			raw_token_diff: diff,
		});
	}

	return revisions;
}
