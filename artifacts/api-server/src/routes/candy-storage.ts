import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, ccStateTable, ccMessagesTable, ccNotificationsTable } from "@workspace/db";
import { eq, desc, sql, lt } from "drizzle-orm";

export type AdminRole = "owner" | "employee";
export type AdminUserStatus = "active" | "disabled";
export type AdminActivityStatus = "active" | "logged_out" | "forced_logout";

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  status: AdminUserStatus;
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface AdminActivityEntry {
  id: string;
  userId: string;
  username: string;
  role: AdminRole;
  loginAt: string;
  logoutAt?: string;
  durationMs?: number;
  status: AdminActivityStatus;
}

export interface SessionRecord {
  userId: string;
  activityId?: string;
  startedAt?: string;
}

export type StateKey = "products" | "orders" | "settings" | "reviews" | "rewardProfiles";

export interface PersistedState {
  products: unknown[];
  orders: unknown[];
  settings: Record<string, unknown>;
  reviews: unknown[];
  rewardProfiles: unknown[];
}

export interface AuthState {
  users: AdminUser[];
  activityLogs: AdminActivityEntry[];
  sessions: Record<string, SessionRecord>;
}

export interface PersistedDb {
  version: 1;
  state: PersistedState;
  auth: AuthState;
}

export interface MessageRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  contactMethod: string;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedKind: string;
  relatedId: string;
  createdAt: string;
  readAt: string | null;
}

export const STATE_KEYS: StateKey[] = ["products", "orders", "settings", "reviews", "rewardProfiles"];
export const OWNER_ONLY_STATE_KEYS = new Set<StateKey>(["products", "settings", "reviews"]);

export const DEFAULT_OWNER_USERNAME = normalizeUsername(
  process.env["ADMIN_USERNAME"] ?? process.env["CANDY_CRACKZZZ_DEFAULT_ADMIN_USERNAME"] ?? "owner",
);
export const DEFAULT_OWNER_PASSWORD =
  process.env["ADMIN_PASSWORD"] ?? process.env["CANDY_CRACKZZZ_DEFAULT_ADMIN_PASSWORD"] ?? "CandyCrackzzzTemp1!";

const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "candy-crackzzz-dev-session-secret-change-me";

const FORCE_FILE_STORAGE = process.env["CANDY_FORCE_FILE_STORAGE"] === "1";
const HAS_DATABASE = !!process.env["DATABASE_URL"] && !FORCE_FILE_STORAGE;

const DATA_FILE_PATH =
  process.env["CANDY_DATA_FILE"] ?? path.resolve(process.cwd(), ".data", "candy-crackzzz-db.json");

export const defaultSettings: Record<string, unknown> = {
  businessName: process.env["BUSINESS_NAME"] ?? "Candy Crackzzz",
  businessPhone: "",
  businessEmail: "",
  orderDestinationEmail: "",
  orderNotificationPhone: "",
  contactDestinationEmail: "",
  serviceArea: "Spring Hill, FL and surrounding areas",
  aboutText:
    "Candy Crackzzz is your ultimate destination for candy-coated fruit and custom treats.",
  socialLinks: { instagram: "", facebook: "", tiktok: "" },
  enableOrdering: true,
  enableCustomOrders: true,
  enableSeasonalSection: true,
  enableGallery: true,
  enableFeaturedSection: true,
  enablePickup: true,
  enableDelivery: true,
  deliveryFeeEnabled: false,
  deliveryFeeAmount: 10,
  minimumOrder: 20,
  showPricesPublicly: true,
  showSoldOutItems: true,
  allowRequestWithoutPrice: true,
  enableRewards: true,
  rewardsPointsPerDollar: 1,
  rewardsAwardOnCompletedOrder: true,
  rewardsAllowPromoStacking: false,
  rewardsTier1Points: 50,
  rewardsTier1Discount: 5,
  rewardsTier2Points: 100,
  rewardsTier2Discount: 12,
  rewardsTier3Points: 200,
  rewardsTier3Discount: 25,
  rewardsDoublePointsEnabled: false,
  rewardsFirstOrderBonusEnabled: false,
  rewardsFirstOrderBonusPoints: 10,
  rewardsBirthdayBonusEnabled: false,
  rewardsBirthdayBonusPoints: 15,
  rewardsSpendThresholdEnabled: false,
  rewardsSpendThresholdAmount: 50,
  rewardsSpendThresholdBonusPoints: 10,
  enableReferrals: true,
  referralReferrerBonusPoints: 15,
  referralReferredCustomerBonusPoints: 10,
  referralBonusOnFirstCompletedOrder: true,
  referralProgramDescription:
    "Use a friend referral code at checkout so both of you can earn bonus points after the order is completed.",
  enablePromoTexts: false,
  promoTextsDescription: "Customers who opt in can receive upcoming promotion texts later.",
  enablePayments: false,
  enableSquare: false,
  squarePaymentLink: "",
  squareInstructions: "",
  enableStripe: false,
  stripePaymentLink: "",
  stripeInstructions: "",
  enablePayPal: false,
  paypalContact: "",
  paypalInstructions: "",
  enableCashApp: false,
  cashAppTag: "",
  cashAppInstructions: "",
  enableVenmo: false,
  venmoUsername: "",
  venmoInstructions: "",
  enableZelle: false,
  zelleContact: "",
  zelleInstructions: "",
  enableQRCode: false,
  qrCodeImageBase64: "",
  qrCodeInstructions: "",
  enableManualInvoice: false,
  manualInvoiceInstructions: "We will send you an invoice after confirming your order.",
  enableCashAtPickup: false,
  cashAtPickupInstructions: "Pay cash when you pick up your order.",
  allowDepositOnly: false,
  allowFullPayment: true,
  allowCashAtPickup: false,
  allowManualInvoice: false,
  paymentInstructions: "",
  logoBase64: "",
  showLogo: true,
};

export const sampleProducts: unknown[] = [
  { id: "1", name: "Rainbow Candy Grapes", slug: "rainbow-candy-grapes", category: "candy-grapes",
    description: "Fresh grapes coated in a rainbow of candy shells. Each grape bursts with fruity flavor and a satisfying candy crackle.",
    shortDescription: "Our signature rainbow candy-coated grapes.",
    price: 15, imageUrl: "/images/rainbow-grapes.png", flavorNotes: "Mixed fruit flavors", colorThemeNotes: "Rainbow",
    isAvailable: true, isFeatured: true, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "2", name: "Blue Raspberry Grapes", slug: "blue-raspberry-grapes", category: "candy-grapes",
    description: "Electric blue candy coating with a tart raspberry punch.", shortDescription: "Sweet and tart blue raspberry.",
    price: 15, imageUrl: "/images/blue-grapes.png", flavorNotes: "Blue Raspberry", colorThemeNotes: "Blue",
    isAvailable: true, isFeatured: true, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "3", name: "Pink Lemonade Grapes", slug: "pink-lemonade-grapes", category: "candy-grapes",
    description: "Hot pink grapes with a refreshing lemonade zing.", shortDescription: "Sweet and sour pink lemonade.",
    price: 15, imageUrl: "/images/pink-grapes.png", flavorNotes: "Pink Lemonade", colorThemeNotes: "Pink",
    isAvailable: true, isFeatured: false, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "4", name: "Tropical Pineapple Chunks", slug: "tropical-pineapple-chunks", category: "candy-pineapple",
    description: "Juicy pineapple chunks with a vibrant tropical candy shell.", shortDescription: "Sweet candied pineapple.",
    price: 18, imageUrl: "/images/tropical-pineapple.png", flavorNotes: "Tropical Punch", colorThemeNotes: "Yellow/Orange",
    isAvailable: true, isFeatured: true, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "5", name: "Mango Habanero Pineapple", slug: "mango-habanero-pineapple", category: "candy-pineapple",
    description: "Spicy and sweet! Mango flavored candy coating with a kick of habanero.", shortDescription: "Spicy sweet candied pineapple.",
    price: 20, imageUrl: "/images/mango-pineapple.png", flavorNotes: "Mango, Habanero", colorThemeNotes: "Orange/Red",
    isAvailable: true, isFeatured: false, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "6", name: "Rainbow Party Tray (Small)", slug: "rainbow-party-tray-small", category: "party-trays",
    description: "A beautiful arrangement of our best candy-coated fruits perfect for small gatherings.", shortDescription: "Mixed tray for small parties.",
    price: 45, imageUrl: "/images/rainbow-tray.png", flavorNotes: "Mixed", colorThemeNotes: "Rainbow",
    isAvailable: true, isFeatured: false, isSeasonal: false, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "7", name: "Deluxe Celebration Tray", slug: "deluxe-celebration-tray", category: "party-trays",
    description: "The ultimate candy fruit experience for large parties and events.", shortDescription: "Large mixed tray for celebrations.",
    price: 85, imageUrl: "/images/deluxe-tray.png", flavorNotes: "Mixed", colorThemeNotes: "Rainbow/Custom",
    isAvailable: true, isFeatured: true, isSeasonal: false, isCustomEligible: true, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "8", name: "Valentine's Special Grapes", slug: "valentines-special-grapes", category: "seasonal",
    description: "Romantic red and pink candy-coated grapes, perfect for your sweetheart.", shortDescription: "Seasonal romantic grapes.",
    price: 20, imageUrl: "/images/valentine-grapes.png", flavorNotes: "Cherry, Strawberry", colorThemeNotes: "Red/Pink",
    isAvailable: true, isFeatured: false, isSeasonal: true, isCustomEligible: false, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
  { id: "9", name: "Birthday Bash Custom Tray", slug: "birthday-bash-custom-tray", category: "custom",
    description: "A totally custom tray tailored to your birthday theme and colors.", shortDescription: "Custom tray for birthdays.",
    price: null, imageUrl: "/images/birthday-tray.png", flavorNotes: "Custom", colorThemeNotes: "Custom",
    isAvailable: true, isFeatured: false, isSeasonal: false, isCustomEligible: true, isSoldOut: false, isVisible: true, createdAt: new Date().toISOString() },
];

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function hashPassword(password: string) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`candy-crackzzz:${password}`)
    .digest("hex");
}

function legacyHashPassword(password: string) {
  return crypto.createHash("sha256").update(`candy-crackzzz:${password}`).digest("hex");
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  return storedHash === hashPassword(plain) || storedHash === legacyHashPassword(plain);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function createDefaultOwner(): AdminUser {
  return {
    id: createId("usr"),
    username: DEFAULT_OWNER_USERNAME,
    passwordHash: hashPassword(DEFAULT_OWNER_PASSWORD),
    role: "owner",
    status: "active",
    createdAt: new Date().toISOString(),
    mustChangePassword: !process.env["ADMIN_PASSWORD"],
  };
}

function freshDefaultDb(): PersistedDb {
  return {
    version: 1,
    state: {
      products: sampleProducts,
      orders: [],
      settings: defaultSettings,
      reviews: [],
      rewardProfiles: [],
    },
    auth: {
      users: [createDefaultOwner()],
      activityLogs: [],
      sessions: {},
    },
  };
}

function mergeWithDefaults(parsed: Partial<PersistedDb>): PersistedDb {
  const defaults = freshDefaultDb();
  return {
    version: 1,
    state: {
      products:
        Array.isArray(parsed.state?.products) && parsed.state!.products.length > 0
          ? parsed.state!.products
          : defaults.state.products,
      orders: Array.isArray(parsed.state?.orders) ? parsed.state!.orders : [],
      settings: {
        ...defaults.state.settings,
        ...((parsed.state?.settings as Record<string, unknown>) ?? {}),
      },
      reviews: Array.isArray(parsed.state?.reviews) ? parsed.state!.reviews : [],
      rewardProfiles: Array.isArray(parsed.state?.rewardProfiles)
        ? parsed.state!.rewardProfiles
        : [],
    },
    auth: {
      users: Array.isArray(parsed.auth?.users) && parsed.auth!.users.length > 0
        ? parsed.auth!.users
        : defaults.auth.users,
      activityLogs: Array.isArray(parsed.auth?.activityLogs) ? parsed.auth!.activityLogs : [],
      sessions:
        parsed.auth?.sessions && typeof parsed.auth.sessions === "object"
          ? (parsed.auth.sessions as Record<string, SessionRecord>)
          : {},
    },
  };
}

function syncOwnerWithEnv(database: PersistedDb): PersistedDb {
  const envUsername = process.env["ADMIN_USERNAME"];
  const envPassword = process.env["ADMIN_PASSWORD"];
  if (!envUsername && !envPassword) return database;

  const desiredUsername = normalizeUsername(envUsername ?? DEFAULT_OWNER_USERNAME);
  const desiredHash = hashPassword(envPassword ?? DEFAULT_OWNER_PASSWORD);

  let owner = database.auth.users.find((u) => u.role === "owner");
  if (!owner) {
    owner = {
      id: createId("usr"),
      username: desiredUsername,
      passwordHash: desiredHash,
      role: "owner",
      status: "active",
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
    };
    database.auth.users = [owner, ...database.auth.users];
    return database;
  }

  let changed = false;
  if (owner.username !== desiredUsername) {
    owner.username = desiredUsername;
    changed = true;
  }
  if (envPassword && owner.passwordHash !== desiredHash) {
    owner.passwordHash = desiredHash;
    owner.mustChangePassword = false;
    changed = true;
  }
  if (owner.status !== "active") {
    owner.status = "active";
    changed = true;
  }
  if (changed) {
    database.auth.users = database.auth.users.map((u) => (u.id === owner!.id ? { ...owner! } : u));
  }
  return database;
}

// ---------- File-mode storage (dev only) ----------
function ensureFile() {
  fs.mkdirSync(path.dirname(DATA_FILE_PATH), { recursive: true });
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(freshDefaultDb(), null, 2), "utf-8");
  }
}

function readFileDb(): PersistedDb {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    return syncOwnerWithEnv(mergeWithDefaults(JSON.parse(raw) as Partial<PersistedDb>));
  } catch {
    const fresh = syncOwnerWithEnv(freshDefaultDb());
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(fresh, null, 2), "utf-8");
    return fresh;
  }
}

function writeFileDb(database: PersistedDb) {
  ensureFile();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(database, null, 2), "utf-8");
}

// ---------- Postgres-mode storage ----------
async function readPgDb(): Promise<PersistedDb> {
  const rows = await db.select().from(ccStateTable);
  const collected: Partial<PersistedDb> = { state: {} as PersistedState, auth: {} as AuthState };
  for (const row of rows) {
    if (row.key === "state") {
      collected.state = row.value as PersistedState;
    } else if (row.key === "auth") {
      collected.auth = row.value as AuthState;
    }
  }
  return syncOwnerWithEnv(mergeWithDefaults(collected));
}

async function writePgDb(database: PersistedDb): Promise<void> {
  await Promise.all([
    db
      .insert(ccStateTable)
      .values({ key: "state", value: database.state as unknown as Record<string, unknown> })
      .onConflictDoUpdate({
        target: ccStateTable.key,
        set: { value: database.state as unknown as Record<string, unknown>, updatedAt: new Date() },
      }),
    db
      .insert(ccStateTable)
      .values({ key: "auth", value: database.auth as unknown as Record<string, unknown> })
      .onConflictDoUpdate({
        target: ccStateTable.key,
        set: { value: database.auth as unknown as Record<string, unknown>, updatedAt: new Date() },
      }),
  ]);
}

// ---------- Cached single instance to avoid race conditions ----------
let cachedDb: PersistedDb | null = null;
let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (cachedDb) return;
  if (!initPromise) {
    initPromise = (async () => {
      cachedDb = HAS_DATABASE ? await readPgDb() : readFileDb();
      if (HAS_DATABASE) {
        // Persist any defaults/owner sync back so the first row exists
        await writePgDb(cachedDb);
      } else {
        writeFileDb(cachedDb);
      }
    })();
  }
  await initPromise;
}

export async function readDb(): Promise<PersistedDb> {
  await ensureInitialized();
  return cachedDb!;
}

export async function writeDb(database: PersistedDb): Promise<void> {
  cachedDb = database;
  if (HAS_DATABASE) {
    await writePgDb(database);
  } else {
    writeFileDb(database);
  }
}

export function isUsingDatabase(): boolean {
  return HAS_DATABASE;
}

// ---------- Messages ----------
const fileMessages: MessageRecord[] = [];

function rowToMessage(row: typeof ccMessagesTable.$inferSelect): MessageRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    subject: row.subject ?? "",
    message: row.message,
    type: row.type ?? "contact",
    contactMethod: row.contactMethod ?? "",
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
  };
}

export async function listMessages(includeArchived = false): Promise<MessageRecord[]> {
  if (!HAS_DATABASE) {
    return [...fileMessages]
      .filter((m) => includeArchived || !m.archivedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const rows = await db.select().from(ccMessagesTable).orderBy(desc(ccMessagesTable.createdAt));
  return rows.map(rowToMessage).filter((m: MessageRecord) => includeArchived || !m.archivedAt);
}

export async function createMessage(input: {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
  contactMethod?: string;
}): Promise<MessageRecord> {
  if (!HAS_DATABASE) {
    const record: MessageRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      phone: input.phone,
      email: input.email,
      subject: input.subject,
      message: input.message,
      type: input.type ?? "contact",
      contactMethod: input.contactMethod ?? "",
      createdAt: new Date().toISOString(),
      readAt: null,
      archivedAt: null,
    };
    fileMessages.unshift(record);
    return record;
  }
  const [row] = await db
    .insert(ccMessagesTable)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email,
      subject: input.subject,
      message: input.message,
      type: input.type ?? "contact",
      contactMethod: input.contactMethod ?? "",
    })
    .returning();
  return rowToMessage(row);
}

export async function markMessageRead(id: string, read: boolean): Promise<MessageRecord | null> {
  const now = read ? new Date() : null;
  if (!HAS_DATABASE) {
    const message = fileMessages.find((m) => m.id === id);
    if (!message) return null;
    message.readAt = now ? now.toISOString() : null;
    return message;
  }
  const [row] = await db
    .update(ccMessagesTable)
    .set({ readAt: now })
    .where(eq(ccMessagesTable.id, id))
    .returning();
  return row ? rowToMessage(row) : null;
}

export async function archiveMessage(id: string, archived: boolean): Promise<MessageRecord | null> {
  const now = archived ? new Date() : null;
  if (!HAS_DATABASE) {
    const message = fileMessages.find((m) => m.id === id);
    if (!message) return null;
    message.archivedAt = now ? now.toISOString() : null;
    return message;
  }
  const [row] = await db
    .update(ccMessagesTable)
    .set({ archivedAt: now })
    .where(eq(ccMessagesTable.id, id))
    .returning();
  return row ? rowToMessage(row) : null;
}

export async function deleteMessage(id: string): Promise<boolean> {
  if (!HAS_DATABASE) {
    const idx = fileMessages.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    fileMessages.splice(idx, 1);
    return true;
  }
  const result = await db.delete(ccMessagesTable).where(eq(ccMessagesTable.id, id)).returning();
  return result.length > 0;
}

// ---------- Notifications ----------
const fileNotifications: NotificationRecord[] = [];

function rowToNotification(row: typeof ccNotificationsTable.$inferSelect): NotificationRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? "",
    relatedKind: row.relatedKind ?? "",
    relatedId: row.relatedId ?? "",
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

export async function listNotifications(limit = 100): Promise<NotificationRecord[]> {
  if (!HAS_DATABASE) {
    return fileNotifications.slice(0, limit);
  }
  const rows = await db
    .select()
    .from(ccNotificationsTable)
    .orderBy(desc(ccNotificationsTable.createdAt))
    .limit(limit);
  return rows.map(rowToNotification);
}

export async function createNotification(input: {
  type: string;
  title: string;
  body?: string;
  relatedKind?: string;
  relatedId?: string;
}): Promise<NotificationRecord> {
  if (!HAS_DATABASE) {
    const record: NotificationRecord = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      relatedKind: input.relatedKind ?? "",
      relatedId: input.relatedId ?? "",
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    fileNotifications.unshift(record);
    if (fileNotifications.length > 500) fileNotifications.length = 500;
    return record;
  }
  const [row] = await db
    .insert(ccNotificationsTable)
    .values({
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      relatedKind: input.relatedKind ?? "",
      relatedId: input.relatedId ?? "",
    })
    .returning();
  return rowToNotification(row);
}

export async function markNotificationRead(id: string, read: boolean): Promise<NotificationRecord | null> {
  const now = read ? new Date() : null;
  if (!HAS_DATABASE) {
    const note = fileNotifications.find((n) => n.id === id);
    if (!note) return null;
    note.readAt = now ? now.toISOString() : null;
    return note;
  }
  const [row] = await db
    .update(ccNotificationsTable)
    .set({ readAt: now })
    .where(eq(ccNotificationsTable.id, id))
    .returning();
  return row ? rowToNotification(row) : null;
}

export async function markAllNotificationsRead(): Promise<number> {
  if (!HAS_DATABASE) {
    const now = new Date().toISOString();
    let count = 0;
    for (const n of fileNotifications) {
      if (!n.readAt) {
        n.readAt = now;
        count += 1;
      }
    }
    return count;
  }
  const result = await db
    .update(ccNotificationsTable)
    .set({ readAt: new Date() })
    .where(sql`${ccNotificationsTable.readAt} IS NULL`)
    .returning();
  return result.length;
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (!HAS_DATABASE) {
    const idx = fileNotifications.findIndex((n) => n.id === id);
    if (idx < 0) return false;
    fileNotifications.splice(idx, 1);
    return true;
  }
  const result = await db
    .delete(ccNotificationsTable)
    .where(eq(ccNotificationsTable.id, id))
    .returning();
  return result.length > 0;
}

export async function pruneOldNotifications(maxAgeDays = 90): Promise<void> {
  if (!HAS_DATABASE) return;
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
  await db.delete(ccNotificationsTable).where(lt(ccNotificationsTable.createdAt, cutoff));
}
