import { supabase } from "@/src/lib/supabaseClient"; // Import supabase
import { Session } from "@supabase/supabase-js";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native"; // Import ActivityIndicator

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("TabLayout mounted, fetching session..."); // Debug log
    // Check for active session when the layout mounts
    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error.message);
        } else {
          console.log("Session fetched:", session ? "Exists" : "Null"); // Debug log
          setSession(session);
        }
      } catch (e) {
        console.error("Exception fetching session:", e);
      } finally {
        setLoading(false);
        console.log("Loading set to false"); // Debug log
      }
    };

    fetchSession();

    // Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "Session null"); // Debug log
      setSession(session);
      // If user logs out, redirect to login
      if (_event === "SIGNED_OUT") {
        console.log("Signed out, replacing route to /"); // Debug log
        router.replace("/");
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log("TabLayout unmounting, unsubscribing listener"); // Debug log
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Don't render tabs until session check is complete
  if (loading) {
    console.log("Still loading session..."); // Debug log
    // Show a loading indicator while checking session
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log("Rendering Tabs, session is:", session ? "Exists" : "Null"); // Debug log
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We'll use custom headers in each screen
        // --- THIS IS THE FIX ---
        // Conditionally hide the tab bar using styles
        tabBarStyle: session ? {} : { display: "none" },
        // --- END FIX ---
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          // You can add icons here later
          // tabBarIcon: ({ color, focused }) => (
          //   <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          // ),
        }}
      />
      {/* Conditionally render the Admin tab LINK as well for extra safety */}
      {/* If no session, setting href to null disables the tab completely */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: session ? "/admin" : null, // Disable tab if no session
          // You can add icons here later
          // tabBarIcon: ({ color, focused }) => (
          //   <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          // ),
        }}
      />
    </Tabs>
  );
}
