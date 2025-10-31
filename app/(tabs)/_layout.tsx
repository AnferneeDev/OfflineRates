import { supabase } from "@/src/lib/supabaseClient";
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * This is the main layout for the (tabs) route group.
 * Its primary job is to manage user authentication state.
 * It shows a loading screen while checking for a session,
 * and it redirects the user if they sign out.
 */
export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on mount to check and listen for auth changes.
    console.log("TabLayout mounted, fetching session...");

    const fetchSession = async () => {
      // Check for an active session when the app first loads.
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (e) {
        console.error("Exception fetching session:", e);
      } finally {
        // We're done checking, so stop the loading spinner.
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for real-time auth events (e.g., SIGNED_IN, SIGNED_OUT).
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "Session null");
      setSession(session);

      // If the user signs out, redirect them to the home/login screen.
      if (_event === "SIGNED_OUT") {
        // Use setImmediate to ensure navigation happens *after* this render cycle.
        setImmediate(() => {
          router.replace("/");
        });
      }
    });

    // Clean up the auth listener when the component unmounts to prevent memory leaks.
    return () => {
      console.log("TabLayout unmounting, unsubscribing listener");
      authListener?.subscription.unsubscribe();
    };
  }, [router]); // We include router here as it's an external dependency.

  // Show a loading spinner while checking the session.
  // This prevents a "flash" of the login screen if the user is already authenticated.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // This is the global rule: hide the *entire tab bar* if there is no
        // session (i.e., user is logged out and will be on the login screen).
        tabBarStyle: session ? {} : { display: "none" },
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
          // This screen will use the default tabBarStyle (visible when logged in).
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          // By setting href to null, the tab is completely removed from the bar
          // if the user isn't logged in.
          href: session ? "/admin" : null,
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
          // This is a local rule: hide the tab bar *when the user is on this tab*.
          // This is useful if "admin" is a stack navigator and you don't want
          // tabs visible on its child screens.
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
