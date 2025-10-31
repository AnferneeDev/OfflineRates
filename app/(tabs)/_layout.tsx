import { supabase } from "@/src/lib/supabaseClient";
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Manages the main tab navigation and a global authentication state.
 * It ensures that auth is checked before rendering tabs and handles
 * redirects on sign-out.
 */
export default function TabLayout() {
  // 'session' tracks the user's login state.
  // 'loading' is true only during the initial session check.
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs on mount to fetch the current session
    // and set up a listener for any auth changes (like SIGN_IN or SIGN_OUT).
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (e) {
        console.error("Exception fetching session:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === "SIGNED_OUT") {
        // Use setImmediate to prevent navigation state conflicts.
        setImmediate(() => {
          router.replace("/");
        });
      }
    });

    // Cleanup the listener on component unmount.
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Shows a loading indicator while the initial session is being verified.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Renders the tab navigator.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hides the entire tab bar if the user is not authenticated.
        tabBarStyle: session ? {} : { display: "none" },
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          // Conditionally removes this tab from the bar if not logged in.
          href: session ? "/admin" : null,
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
          // Hides the tab bar *when on* this specific screen.
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
