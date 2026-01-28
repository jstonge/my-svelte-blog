import * as v from 'valibot';
import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { darkDataSurvey, type SurveyField } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Valid fields derived from schema type
const validFields: SurveyField[] = [
	'consent',
	'socialMediaPrivacy',
	'platformMatters',
	'relativePreferences',
	'govPreferences',
	'polPreferences',
	'age',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

// Fields that store numeric values
const numericFields: SurveyField[] = ['relativePreferences', 'govPreferences', 'polPreferences', 'age', 'genderOrd', 'orientationOrd', 'raceOrd'];

function isValidField(field: string): field is SurveyField {
	return validFields.includes(field as SurveyField);
}

function processValue(field: SurveyField, value: string | number | string[]) {
	if (field === 'platformMatters' && Array.isArray(value)) {
		return value.join(',');
	}
	if (numericFields.includes(field) && typeof value === 'string') {
		return parseInt(value, 10);
	}
	return value;
}

// Single entry point for saving survey answers
export const saveAnswer = command(
	v.object({
		fingerprint: v.string(),
		field: v.string(),
		value: v.union([v.number(), v.string(), v.array(v.string())])
	}),
	async (data) => {
		const { fingerprint, field } = data;

		if (!isValidField(field)) {
			throw new Error(`Invalid field: ${field}`);
		}

		const value = processValue(field, data.value);

		const existing = await db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			await db.insert(darkDataSurvey).values({
				fingerprint,
				[field]: value
			});
		} else {
			await db
				.update(darkDataSurvey)
				.set({ [field]: value })
				.where(eq(darkDataSurvey.fingerprint, fingerprint));
		}

		return { message: `${field} saved` };
	}
);

// Remote function to get survey response by fingerprint
export const getSurveyResponse = query(
	v.string(),
	async (fingerprint) => {
		const survey = await db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		return survey || null;
	}
);
