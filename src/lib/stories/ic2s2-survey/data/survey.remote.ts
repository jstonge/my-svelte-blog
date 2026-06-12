import * as v from 'valibot';
import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { ic2s2Survey, type Ic2s2SurveyField } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Valid fields derived from schema type
const validFields: Ic2s2SurveyField[] = ['preferredCombination', 'why'];

function isValidField(field: string): field is Ic2s2SurveyField {
	return validFields.includes(field as Ic2s2SurveyField);
}

// Single entry point for saving survey answers
export const saveAnswer = command(
	v.object({
		fingerprint: v.string(),
		field: v.string(),
		value: v.string()
	}),
	async (data) => {
		const { fingerprint, field, value } = data;

		if (!isValidField(field)) {
			throw new Error(`Invalid field: ${field}`);
		}

		const existing = await db
			.select()
			.from(ic2s2Survey)
			.where(eq(ic2s2Survey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			await db.insert(ic2s2Survey).values({
				fingerprint,
				[field]: value
			});
		} else {
			await db
				.update(ic2s2Survey)
				.set({ [field]: value })
				.where(eq(ic2s2Survey.fingerprint, fingerprint));
		}

		return { message: `${field} saved` };
	}
);

// Remote function to get survey response by fingerprint
export const getSurveyResponse = query(v.string(), async (fingerprint) => {
	const survey = await db
		.select()
		.from(ic2s2Survey)
		.where(eq(ic2s2Survey.fingerprint, fingerprint))
		.get();

	return survey || null;
});
