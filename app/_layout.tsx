import { initDatabase } from "@/src/lib/database";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        console.log("Database initialized successfully");
      } catch (e) {
        console.error("Error initializing database: ", e);
      }
    }
    setupDatabase();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
