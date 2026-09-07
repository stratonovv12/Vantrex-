import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  vantrexGamesTable,
  vantrexPlatformsTable,
  vantrexProfilesTable,
  vantrexWithdrawalsTable,
} from "@workspace/db";

const ADMIN_EMAIL = "arturstratonov2@gmail.com";
type CatalogKind = "casino" | "sports";

function isAdmin(req: Request) {
  return req.header("x-vantrex-email") === ADMIN_EMAIL;
}

function adminOrForbidden(req: Request, res: Response) {
  if (isAdmin(req)) return true;
  res.status(403).json({ error: "Admin access required" });
  return false;
}

function profileEmail(req: Request) {
  return req.header("x-vantrex-email") || ADMIN_EMAIL;
}

async function getOrCreateProfile(req: Request) {
  const email = profileEmail(req);
  const existing = await db.select().from(vantrexProfilesTable).where(eq(vantrexProfilesTable.email, email)).limit(1);
  if (existing[0]) return existing[0];
  const created = await db.insert(vantrexProfilesTable).values({
    id: randomUUID(),
    email,
    referralCode: `VTX-${randomUUID().slice(0, 8).toUpperCase()}`,
  }).returning();
  return created[0];
}

function toProfile(row: typeof vantrexProfilesTable.$inferSelect) {
  const referralCount = row.referralCount;
  const tier = referralCount >= 200 ? "top" : referralCount >= 100 ? "intermediate" : "beginner";
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatarUrl,
    language: row.language === "RU" ? "RU" : "EN",
    activePlatformId: row.activePlatformId,
    referralCode: row.referralCode,
    referralCount,
    balance: Number(row.balance),
    tier,
    hourlyRate: tier === "top" ? 0.25 : tier === "intermediate" ? 0.1 : 0.05,
  };
}

const router: IRouter = Router();
router.use((req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
});

router.get("/platforms", async (_req, res) => {
  const rows = await db.select().from(vantrexPlatformsTable).orderBy(vantrexPlatformsTable.createdAt);
  res.json(rows);
});

router.post("/platforms", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const name = String(req.body.name ?? "").trim();
  const affiliateUrl = String(req.body.affiliateUrl ?? "").trim();
  if (!name || !affiliateUrl) {
    res.status(400).json({ error: "Platform name and affiliate URL are required" });
    return;
  }
  const created = await db.insert(vantrexPlatformsTable).values({
    id: randomUUID(), name, logoUrl: req.body.logoUrl || null, affiliateUrl,
  }).returning();
  res.status(201).json(created[0]);
});

router.patch("/platforms/:platformId", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const updated = await db.update(vantrexPlatformsTable).set({
    ...(req.body.name !== undefined ? { name: String(req.body.name).trim() } : {}),
    ...(req.body.logoUrl !== undefined ? { logoUrl: req.body.logoUrl || null } : {}),
    ...(req.body.affiliateUrl !== undefined ? { affiliateUrl: String(req.body.affiliateUrl).trim() } : {}),
  }).where(eq(vantrexPlatformsTable.id, req.params.platformId)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Platform not found" }); return; }
  res.json(updated[0]);
});

router.delete("/platforms/:platformId", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  await db.delete(vantrexGamesTable).where(eq(vantrexGamesTable.platformId, req.params.platformId));
  const deleted = await db.delete(vantrexPlatformsTable).where(eq(vantrexPlatformsTable.id, req.params.platformId)).returning();
  if (!deleted[0]) { res.status(404).json({ error: "Platform not found" }); return; }
  const current = await getOrCreateProfile(req);
  if (current.activePlatformId === req.params.platformId) {
    await db.update(vantrexProfilesTable).set({ activePlatformId: null }).where(eq(vantrexProfilesTable.id, current.id));
  }
  res.status(204).send();
});

router.get("/games", async (req, res) => {
  const platformId = typeof req.query.platformId === "string" ? req.query.platformId : undefined;
  const kind = req.query.kind === "sports" || req.query.kind === "casino" ? req.query.kind : undefined;
  const filters = [platformId ? eq(vantrexGamesTable.platformId, platformId) : undefined, kind ? eq(vantrexGamesTable.kind, kind) : undefined].filter(Boolean);
  const rows = filters.length ? await db.select().from(vantrexGamesTable).where(and(...filters as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]])) : await db.select().from(vantrexGamesTable);
  res.json(rows);
});

router.post("/games", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const platformId = String(req.body.platformId ?? "");
  const title = String(req.body.title ?? "").trim();
  const affiliateUrl = String(req.body.affiliateUrl ?? "").trim();
  if (!platformId || !title || !affiliateUrl) {
    res.status(400).json({ error: "Platform, title and affiliate URL are required" });
    return;
  }
  const created = await db.insert(vantrexGamesTable).values({
    id: randomUUID(), platformId, title, description: String(req.body.description ?? "").trim(),
    imageUrl: req.body.imageUrl || null, affiliateUrl, kind: req.body.kind === "sports" ? "sports" : "casino",
  }).returning();
  res.status(201).json(created[0]);
});

router.patch("/games/:gameId", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const updated = await db.update(vantrexGamesTable).set({
    ...(req.body.platformId !== undefined ? { platformId: String(req.body.platformId) } : {}),
    ...(req.body.title !== undefined ? { title: String(req.body.title).trim() } : {}),
    ...(req.body.description !== undefined ? { description: String(req.body.description).trim() } : {}),
    ...(req.body.imageUrl !== undefined ? { imageUrl: req.body.imageUrl || null } : {}),
    ...(req.body.affiliateUrl !== undefined ? { affiliateUrl: String(req.body.affiliateUrl).trim() } : {}),
    ...(req.body.kind !== undefined ? { kind: req.body.kind === "sports" ? "sports" : "casino" } : {}),
  }).where(eq(vantrexGamesTable.id, req.params.gameId)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Game not found" }); return; }
  res.json(updated[0]);
});

router.delete("/games/:gameId", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const deleted = await db.delete(vantrexGamesTable).where(eq(vantrexGamesTable.id, req.params.gameId)).returning();
  if (!deleted[0]) { res.status(404).json({ error: "Game not found" }); return; }
  res.status(204).send();
});

router.get("/profile", async (req, res) => {
  res.json(toProfile(await getOrCreateProfile(req)));
});

router.patch("/profile", async (req, res) => {
  const current = await getOrCreateProfile(req);
  const updated = await db.update(vantrexProfilesTable).set({
    ...(req.body.username !== undefined ? { username: String(req.body.username).trim() } : {}),
    ...(req.body.avatarUrl !== undefined ? { avatarUrl: req.body.avatarUrl || null } : {}),
    ...(req.body.language === "RU" || req.body.language === "EN" ? { language: req.body.language } : {}),
    ...(req.body.activePlatformId !== undefined ? { activePlatformId: req.body.activePlatformId || null } : {}),
  }).where(eq(vantrexProfilesTable.id, current.id)).returning();
  res.json(toProfile(updated[0]));
});

router.get("/profile/username-availability", async (req, res) => {
  const username = String(req.query.username ?? "").trim().toLowerCase();
  const match = await db.select({ id: vantrexProfilesTable.id }).from(vantrexProfilesTable).where(eq(vantrexProfilesTable.username, username)).limit(1);
  res.json({ username, available: username.length >= 3 && username !== "admin" && username !== "vantrex" && match.length === 0 });
});

router.get("/profile/dashboard", async (req, res) => {
  const current = toProfile(await getOrCreateProfile(req));
  const nextTierAt = current.tier === "beginner" ? 100 : current.tier === "intermediate" ? 200 : 200;
  res.json({ profile: current, nextTierAt, referralsToNextTier: current.tier === "top" ? 0 : Math.max(nextTierAt - current.referralCount, 0), secondsActive: 0 });
});

router.get("/withdrawals", async (_req, res) => {
  const rows = await db.select().from(vantrexWithdrawalsTable).orderBy(vantrexWithdrawalsTable.requestedAt);
  res.json(rows.map((row) => ({ ...row, amount: Number(row.amount), requestedAt: row.requestedAt.toISOString() })));
});

router.post("/withdrawals", async (req, res) => {
  const current = await getOrCreateProfile(req);
  const amount = Number(req.body.amount);
  const walletAddress = String(req.body.walletAddress ?? "").trim();
  if (!Number.isFinite(amount) || amount < 0.01 || walletAddress.length < 20) {
    res.status(400).json({ error: "Enter a valid amount and TRC20 wallet address" });
    return;
  }
  const created = await db.insert(vantrexWithdrawalsTable).values({
    id: randomUUID(), profileId: current.id, username: current.username || "new-player",
    amount: amount.toFixed(4), walletAddress, status: "pending",
  }).returning();
  res.status(201).json({ ...created[0], amount, requestedAt: created[0].requestedAt.toISOString() });
});

router.patch("/withdrawals/:withdrawalId", async (req, res) => {
  if (!adminOrForbidden(req, res)) return;
  const updated = await db.update(vantrexWithdrawalsTable).set({
    status: req.body.status === "paid" ? "paid" : "pending",
  }).where(eq(vantrexWithdrawalsTable.id, req.params.withdrawalId)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Withdrawal not found" }); return; }
  res.json({ ...updated[0], amount: Number(updated[0].amount), requestedAt: updated[0].requestedAt.toISOString() });
});

export default router;