import * as SQLite from "expo-sqlite";

// Types for better TypeScript support
export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  // --- FIX 1: Add icon to local Category type ---
  icon: string | null;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithCategory extends Service {
  category_name?: string;
  // --- FIX 2: Add category_icon to the joined type ---
  category_icon?: string | null;
}

// Opens or creates the database file
function createDatabase() {
  const db = SQLite.openDatabaseSync("offline-rates.db");
  return db;
}

// Get the database instance
const db = createDatabase();

// SQL command to create the 'categories' table
const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    -- --- FIX 3: Add icon column to local table ---
    icon TEXT
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
 */
export async function initDatabase(): Promise<void> {
  try {
    // --- DEV FIX: Drop tables to force recreation with new schema ---
    // This ensures the 'icon' column is added. Remove for production.
    await db.execAsync("DROP TABLE IF EXISTS services");
    await db.execAsync("DROP TABLE IF EXISTS categories");
    // --- END DEV FIX ---

    await db.execAsync(`
      ${createCategoriesTable}
      ${createServicesTable}
    `);
    console.log("Database tables created successfully (schema updated).");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

/**
 * Fetches all services with their categories from the local DB
 */
export async function fetchLocalServices(): Promise<ServiceWithCategory[]> {
  try {
    const allRows = await db.getAllAsync<ServiceWithCategory>(`
      SELECT 
        services.*,
        categories.name as category_name,
        -- --- FIX 4: Select the icon from the categories table ---
        categories.icon as category_icon
      FROM services
      LEFT JOIN categories ON services.category_id = categories.id
      ORDER BY categories.name, services.name
    `);

    return allRows;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

/**
 * Fetches all categories from the local DB
 */
export async function fetchLocalCategories(): Promise<Category[]> {
  try {
    // SELECT * will automatically include the new 'icon' column
    const allRows = await db.getAllAsync<Category>(`
      SELECT * FROM categories ORDER BY name
    `);

    return allRows;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Inserts or updates categories in the database
 */
export async function upsertCategories(categories: Category[]): Promise<void> {
  try {
    await db.execAsync("BEGIN TRANSACTION");

    for (const category of categories) {
      // --- FIX 5: Add 'icon' to the INSERT statement and values ---
      await db.runAsync(
        `INSERT OR REPLACE INTO categories (id, name, created_at, updated_at, icon) 
         VALUES (?, ?, ?, ?, ?)`,
        [category.id, category.name, category.created_at, category.updated_at, category.icon || null]
      );
    }

    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    console.error("Error upserting categories:", error);
    throw error;
  }
}

/**
 * Inserts or updates services in the database
 */
export async function upsertServices(services: Service[]): Promise<void> {
  try {
    await db.execAsync("BEGIN TRANSACTION");

    for (const service of services) {
      await db.runAsync(
        `INSERT OR REPLACE INTO services (id, category_id, name, price, description, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        // --- THIS WAS THE BUG: Changed second service.id to service.category_id ---
        [service.id, service.category_id, service.name, service.price, service.description || null, service.created_at, service.updated_at]
      );
    }

    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    console.error("Error upserting services:", error);
    throw error;
  }
}

/**
 * Clears all data from the database (for reset/sync purposes)
 */
export async function clearAllData(): Promise<void> {
  try {
    await db.execAsync(`
      DELETE FROM services;
      DELETE FROM categories;
    `);
    console.log("All data cleared from database.");
  } catch (error) {
    console.error("Error clearing database:", error);
    throw error;
  }
}

/**
 * Wipes and replaces all local data with fresh data from Supabase
 */
export async function syncDatabase(categories: Category[], services: Service[]): Promise<void> {
  try {
    console.log("Starting database sync...");
    await clearAllData();
    await upsertCategories(categories);
    await upsertServices(services);
    console.log("Database sync completed successfully.");
  } catch (error) {
    console.error("Error during database sync:", error);
    throw error;
  }
}

/**
 * Search services by name or description
 */
export async function searchServices(query: string): Promise<ServiceWithCategory[]> {
  try {
    const searchTerm = `%${query}%`;
    const allRows = await db.getAllAsync<ServiceWithCategory>(
      `
      SELECT 
        services.*,
        categories.name as category_name,
        -- --- FIX 6: Also select icon during search ---
        categories.icon as category_icon
      FROM services
      LEFT JOIN categories ON services.category_id = categories.id
      WHERE services.name LIKE ? OR services.description LIKE ? OR categories.name LIKE ?
      ORDER BY categories.name, services.name
    `,
      [searchTerm, searchTerm, searchTerm]
    );

    return allRows;
  } catch (error) {
    console.error("Error searching services:", error);
    return [];
  }
}

/**
 * Get services by category ID
 */
export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  try {
    const allRows = await db.getAllAsync<Service>(
      `
      SELECT * FROM services 
      WHERE category_id = ? 
      ORDER BY name
    `,
      [categoryId]
    );

    return allRows;
  } catch (error) {
    console.error("Error fetching services by category:", error);
    return [];
  }
}

/**
 * Check if database has any data
 */
export async function hasData(): Promise<boolean> {
  try {
    const categories = await fetchLocalCategories();
    return categories.length > 0;
  } catch (error) {
    console.error("Error checking database data:", error);
    return false;
  }
}

// Export the database instance
export { db };
