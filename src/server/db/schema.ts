import { sql } from "drizzle-orm";
import { int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `empchecker_${name}`);

export const images = createTable(
  "image",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    phash: text("phash", { length: 256 }).notNull(),
    discordId: text("discord_id", { length: 256 }).notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
);

export const user = createTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: int("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = createTable("session", {
  id: text("id").primaryKey(),
  expiresAt: int("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = createTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: int("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: int("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = createTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: int("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: int("created_at", { mode: "timestamp" }),
  updatedAt: int("updated_at", { mode: "timestamp" }),
});
