import { supabase } from "@/src/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("TabLayout mounted, fetching session...");

    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error.message);
        } else {
          console.log("Session fetched:", session ? "Exists" : "Null");
          setSession(session);
        }
      } catch (e) {
        console.error("Exception fetching session:", e);
      } finally {
        setLoading(false);
        console.log("Loading set to false");
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "Session null");
      setSession(session);

      if (_event === "SIGNED_OUT") {
        console.log("Signed out, will redirect to /");
        setImmediate(() => {
          try {
            router.replace("/");
          } catch (e) {
            console.error("Navigation error:", e);
          }
        });
      }
    });

    return () => {
      console.log("TabLayout unmounting, unsubscribing listener");
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    console.log("Still loading session...");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log("Rendering Tabs, session is:", session ? "Exists" : "Null");
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: session ? {} : { display: "none" },
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: session ? "/admin" : null,
        }}
      />
    </Tabs>
  );
}
