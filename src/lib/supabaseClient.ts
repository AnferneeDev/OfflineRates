import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = "https://avgcumwjkhxslajaxgtb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z2N1bXdqa2h4c2xhamF4Z3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTQ1MjgsImV4cCI6MjA3NzA3MDUyOH0.O6rBDDYVeZlTe_hZJzXIQfEsoLHr0M7-l8oaqeaphec";

// --- Important: AsyncStorage Setup ---
const asyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    return AsyncStorage.removeItem(key);
  },
};

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: asyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: "app",
  },
});

// --- Type definitions for your Supabase tables ---

export type CategoryRow = Database["app"]["Tables"]["categories"]["Row"];
export type ServiceRow = Database["app"]["Tables"]["services"]["Row"];
export type CategoryInsert = Database["app"]["Tables"]["categories"]["Insert"];
export type ServiceInsert = Database["app"]["Tables"]["services"]["Insert"];
export type CategoryUpdate = Database["app"]["Tables"]["categories"]["Update"];
export type ServiceUpdate = Database["app"]["Tables"]["services"]["Update"];

// --- Helper Type for the Database Schema ---
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  app: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          // --- FIX: Add icon field ---
          icon: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          // --- FIX: Add icon field ---
          icon?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          // --- FIX: Add icon field ---
          icon?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          price: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          price: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          price?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
