import { pgTable, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vantrexPlatformsTable = pgTable("vantrex_platforms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vantrexGamesTable = pgTable("vantrex_games", {
  id: text("id").primaryKey(),
  platformId: text("platform_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vantrexProfilesTable = pgTable("vantrex_profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().default(""),
  avatarUrl: text("avatar_url"),
  language: text("language").notNull().default("EN"),
  activePlatformId: text("active_platform_id"),
  referralCode: text("referral_code").notNull().unique(),
  referralCount: integer("referral_count").notNull().default(0),
  balance: numeric("balance", { precision: 12, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vantrexWithdrawalsTable = pgTable("vantrex_withdrawals", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  username: text("username").notNull(),
  amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
  walletAddress: text("wallet_address").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
});

export const insertVantrexPlatformSchema = createInsertSchema(vantrexPlatformsTable).omit({ createdAt: true });
export const insertVantrexGameSchema = createInsertSchema(vantrexGamesTable).omit({ createdAt: true });
export const insertVantrexProfileSchema = createInsertSchema(vantrexProfilesTable).omit({ createdAt: true });
export const insertVantrexWithdrawalSchema = createInsertSchema(vantrexWithdrawalsTable).omit({ requestedAt: true });

export type InsertVantrexPlatform = z.infer<typeof insertVantrexPlatformSchema>;
export type InsertVantrexGame = z.infer<typeof insertVantrexGameSchema>;
export type InsertVantrexProfile = z.infer<typeof insertVantrexProfileSchema>;
export type InsertVantrexWithdrawal = z.infer<typeof insertVantrexWithdrawalSchema>;