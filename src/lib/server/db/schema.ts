import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql, type InferSelectModel } from "drizzle-orm";

export const darkDataSurvey = sqliteTable("dark_data_survey", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fingerprint: text("fingerprint").notNull().unique(),
  consent: integer("consent"),
  socialMediaPrivacy: integer("social_media_privacy"),
  platformMatters: text("platform_matters"),
  relativePreferences: integer("relative_preferences"),
  govPreferences: integer("gov_preferences"),
  polPreferences: integer("pol_preferences"),
  age: text("age"),
  genderOrd: integer("gender_ord"),
  orientationOrd: integer("orientation_ord"),
  raceOrd: integer("race_ord"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// Types derived from schema
export type DarkDataSurvey = InferSelectModel<typeof darkDataSurvey>;
export type SurveyField = keyof Omit<DarkDataSurvey, 'id' | 'fingerprint' | 'createdAt'>;

export const ic2s2Survey = sqliteTable("ic2s2_survey", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fingerprint: text("fingerprint").notNull().unique(),
  preferredCombination: text("preferred_combination"),
  why: text("why"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export type Ic2s2Survey = InferSelectModel<typeof ic2s2Survey>;
export type Ic2s2SurveyField = keyof Omit<Ic2s2Survey, 'id' | 'fingerprint' | 'createdAt'>;
