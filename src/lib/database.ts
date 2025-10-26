import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

// Opens or creates the database file
export function openDatabase() {
  if (Platform.OS === "web") {
    return {
      withTransactionAsync: async (callback: (tx: any) => Promise<void>) => {
        console.warn("SQLite is not supported on web.");
        // Mock the transaction callback
        await callback({ executeSqlAsync: async () => console.warn("Mock executeSqlAsync") });
      },
    } as any; // Use 'as any' to avoid type mismatch with Promise<SQLiteDatabase>
  }

  const db = SQLite.openDatabaseAsync("offline-rates.db");
  return db;
}

const dbPromise = openDatabase();

// SQL command to create the 'categories' table
const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

// SQL command to create the 'services' table
const createServicesTable = `
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Initializes the database.
 * Creates tables if they don't exist.
 */
export async function initDatabase() {
  const db = await dbPromise;
  if (typeof db.withTransactionAsync !== "function") {
    console.warn("DB not initialized (web mock)");
    return;
  }

  await db.withTransactionAsync(async (tx: any) => {
    try {
      console.log("Initializing database tables...");
      await tx.executeSqlAsync(createCategoriesTable, []);
      await tx.executeSqlAsync(createServicesTable, []);
      console.log("Database tables created successfully.");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  });
}

// --- Placeholder functions for later steps ---

/**
 * Fetches all services and their categories from the local DB
 * This will be used in Step C2
 */
export async function fetchLocalServices() {
  const db = await dbPromise;
  if (typeof db.withTransactionAsync !== "function") {
    console.warn("DB not initialized (web mock)");
    return [];
  }

  // We will build this out in Step C
  console.log("Placeholder: Fetching services...");
  return [];
}

/**
 * Wipes and replaces all local data with fresh data from Supabase
 * This will be used in Step D5
 */
export async function syncDatabase(categories: any[], services: any[]) {
  const db = await dbPromise;
  if (typeof db.withTransactionAsync !== "function") {
    console.warn("DB not initialized (web mock)");
    return;
  }

  // We will build this out in Step D
  console.log("Placeholder: Syncing database...");
}
