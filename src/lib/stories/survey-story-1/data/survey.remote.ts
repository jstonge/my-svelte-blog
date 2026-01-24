import * as v from 'valibot';
import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { darkDataSurvey } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Valid fields for survey updates (schema uses camelCase)
const validFields = [
	'consent',
	'socialMediaPrivacy',
	'platformMatters',
	'institutionPreferences',
	'demographicsMatter',
	'relativePreferences',
	'govPreferences',
	'polPreferences',
	'age',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

// Map snake_case field names from frontend to camelCase schema fields
const fieldNameMap = {
	'gender_ord': 'genderOrd',
	'orientation_ord': 'orientationOrd',
	'race_ord': 'raceOrd'
};

// Normalize field name (convert snake_case to camelCase if needed)
/** @param {string} field */
function normalizeFieldName(field) {
	return fieldNameMap[/** @type {keyof typeof fieldNameMap} */ (field)] || field;
}

// Remote function to post survey answer (with string value conversion)
export const postAnswer = command(
	v.object({ fingerprint: v.string(), value: v.string(), field: v.string() }),
	async (data) => {
		const { fingerprint, value } = data;
		const field = normalizeFieldName(data.field);

		if (!validFields.includes(field)) {
			throw new Error(`Invalid field: ${field}`);
		}

		// Check if survey exists
		const existing = await db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			// Create new survey with the field
			await db.insert(darkDataSurvey).values({
				fingerprint,
				[field]: value
			});
		} else {
			// Update existing survey
			await db
				.update(darkDataSurvey)
				.set({ [field]: value })
				.where(eq(darkDataSurvey.fingerprint, fingerprint));
		}

		console.log(`Saved ${field}:`, value);
		return { message: `${field} saved successfully` };
	}
);

// Remote function to upsert survey answer (with direct value - number or string)
export const upsertAnswer = command(
	v.object({ fingerprint: v.string(), field: v.string(), value: v.union([v.number(), v.string()]) }),
	async (data) => {
		const { fingerprint, value } = data;
		const field = normalizeFieldName(data.field);

		if (!validFields.includes(field)) {
			throw new Error(`Invalid field: ${field}`);
		}

		// Check if survey exists
		const existing = await db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			// Create new survey with the field
			await db.insert(darkDataSurvey).values({
				fingerprint,
				[field]: value
			});
		} else {
			// Update existing survey
			await db
				.update(darkDataSurvey)
				.set({ [field]: value })
				.where(eq(darkDataSurvey.fingerprint, fingerprint));
		}

		console.log(`Upserted ${field}:`, value);
		return { message: `${field} upserted successfully` };
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
