import { Tabs } from "expo-router";
import { Text, View } from "react-native";

// Simple mock icon component
const TabIcon = ({ name }: { name: string }) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Text style={{ fontSize: 24 }}>{name === "services" ? "📋" : "⚙️"}</Text>
  </View>
);

export default function TabLayout() {
  // We will get the user role from our AuthContext here
  const userRole = "admin"; // Hardcoded for now

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#09090b",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => <TabIcon name="services" />,
        }}
      />
      {/* This is a simple way to hide the Admin tab from guests.
        If the user is not an admin, this tab won't even exist.
      */}
      {userRole === "admin" && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, focused }) => <TabIcon name="admin" />,
          }}
        />
      )}
    </Tabs>
  );
}
