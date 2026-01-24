import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const darkDataSurvey = sqliteTable("dark_data_survey", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fingerprint: text("fingerprint").notNull().unique(),
  consent: integer("consent"),
  socialMediaPrivacy: integer("social_media_privacy"),
  platformMatters: text("platform_matters"),
  institutionPreferences: integer("institution_preferences"),
  demographicsMatter: integer("demographics_matter"),
  relativePreferences: integer("relative_preferences"),
  govPreferences: integer("gov_preferences"),
  polPreferences: integer("pol_preferences"),
  age: text("age"),
  genderOrd: integer("gender_ord"),
  orientationOrd: integer("orientation_ord"),
  raceOrd: integer("race_ord"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
