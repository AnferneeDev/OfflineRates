import { useRouter } from "expo-router";

import { useState } from "react";

import { ActivityIndicator, Alert, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";

// Import the real Supabase client

import { supabase } from "@/src/lib/supabaseClient";

// This is your new "Index" screen, which will function as the Login.

export default function LoginScreen() {
  const [username, setUsername] = useState(""); // Assuming this is the email

  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("guest");

  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const router = useRouter();

  // --- Real Supabase Admin Login ---

  const handleAdminLogin = async () => {
    setIsLoading(true); // Start loading

    try {
      // Use the real Supabase auth

      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Pass the email (stored in username state)

        password: password,
      });

      if (error) {
        // Show Supabase error message

        Alert.alert("Login Failed", error.message || "Invalid credentials.");
      } else if (data.session) {
        // Successful login!

        Alert.alert("Welcome Admin", "Successfully logged in.");

        // Navigate to the services screen

        router.push("/services");
      } else {
        // Should not happen if there's no error, but good to check

        Alert.alert("Login Failed", "No session received. Please try again.");
      }
    } catch (e: any) {
      // Catch any unexpected errors during the API call

      Alert.alert("Login Error", e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  // --- Guest Login ---

  const handleGuestLogin = async () => {
    // Make it async

    try {
      // Explicitly sign out any existing session

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error.message);

        Alert.alert("Error", "Could not switch to guest mode.");

        return; // Stop if sign out failed
      }

      // Now proceed as guest

      Alert.alert("Welcome Guest", "Browsing services as a guest");

      router.push("/services");
    } catch (e: any) {
      console.error("Exception during guest login:", e);

      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-100">
      <StatusBar
        barStyle="dark-content" // Use "light-content" for a dark background
        translucent={false}
        hidden={true}
      />

      <View className="flex-1 justify-center items-center p-4">
        <View className="w-full max-w-[400px] bg-white rounded-xl">
          {/* not to touch */}
          {/* Card Header */}
          <View className="p-6 border-b border-zinc-200 items-center">
            <Text className="text-2xl font-semibold mb-1">Hospital Services</Text>
            <Text className="text-sm text-zinc-500">Choose how you would like to access the system</Text>
          </View>
          {/* Card Content */}
          <View className="p-6">
            {/* Manual Tabs */}

            <View className="flex-row w-full bg-zinc-200 rounded-lg">
              <TouchableOpacity
                className={`flex-1 py-2.5 items-center rounded-md ${activeTab === "guest" ? "bg-white" : ""}`}
                onPress={() => setActiveTab("guest")}
                disabled={isLoading} // Disable while loading
              >
                <Text className="text-sm font-medium">(G) Guest</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-2.5 items-center rounded-md ${activeTab === "admin" ? "bg-white" : ""}`}
                onPress={() => setActiveTab("admin")}
                disabled={isLoading} // Disable while loading
              >
                <Text className="text-sm font-medium">(A) Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs Content */}

            {activeTab === "guest" ? (
              // Guest Tab

              <View className="mt-6 gap-4">
                <Text className="text-xl font-semibold text-center">Browse as Guest</Text>
                <Text className="text-sm text-zinc-500 text-center">View and search hospital services and prices</Text>
                <TouchableOpacity className={`h-11 rounded-lg justify-center items-center ${isLoading ? "bg-zinc-400" : "bg-zinc-900"}`} onPress={handleGuestLogin} disabled={isLoading}>
                  <Text className="text-white text-base font-medium">Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Admin Tab

              <View className="mt-6 gap-4">
                <View className="w-full gap-2">
                  <Text className="text-sm font-medium text-zinc-700">Admin Email</Text>
                  <TextInput
                    className="h-11 border border-zinc-300 rounded-lg px-3 text-base bg-white"
                    placeholder="Enter admin email"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>

                <View className="w-full gap-2">
                  <Text className="text-sm font-medium text-zinc-700">Password</Text>
                  <TextInput className="h-11 border border-zinc-300 rounded-lg px-3 text-base bg-white" placeholder="Enter admin password" value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} />
                </View>

                {/* Security Warning - You might remove this later */}

                <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <Text className="text-red-500 text-xs text-center">Ensure you have created an admin user in your Supabase project.</Text>
                </View>

                <TouchableOpacity className={`h-11 rounded-lg justify-center items-center ${isLoading ? "bg-zinc-400" : "bg-zinc-900"}`} onPress={handleAdminLogin} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-base font-medium">Login as Admin</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
