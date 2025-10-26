import { Stack } from "expo-router";
import { useEffect } from "react";

// Make sure this path is correct for your project
import { initDatabase } from "@/src/lib/database";

export default function RootLayout() {
  // --- This is Step B3: Initialize the Database ---
  // We run this here, in the main layout, so it
  // only runs ONCE when the app first loads.
  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        console.log("Database initialized successfully");
      } catch (e) {
        console.error("Error initializing database:", e);
      }
    }
    setupDatabase();
  }, []);
  // --- End of Step B3 ---

  // --- This is Step B4: Create Navigation Stacks ---
  // This <Stack> is your app's main navigator.
  // It tells the router about all your top-level screens.
  return (
    <Stack>
      {/* This is your Login Screen. It's the default (/).
        This will fix your "Unmatched Route" error.
      */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* This is the "group" that contains your main app 
        (Services and Admin screens) with the tab bar at the bottom.
      */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
