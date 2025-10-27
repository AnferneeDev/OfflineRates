import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hospital Services</Text>
            <Text style={styles.cardDescription}>Choose how you would like to access the system</Text>
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Manual Tabs */}
            <View style={styles.tabsList}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "guest" && styles.tabButtonActive]}
                onPress={() => setActiveTab("guest")}
                disabled={isLoading} // Disable while loading
              >
                <Text style={styles.tabButtonText}>(G) Guest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "admin" && styles.tabButtonActive]}
                onPress={() => setActiveTab("admin")}
                disabled={isLoading} // Disable while loading
              >
                <Text style={styles.tabButtonText}>(A) Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs Content */}
            {activeTab === "guest" ? (
              // Guest Tab
              <View style={styles.tabContent}>
                <Text style={styles.guestTitle}>Browse as Guest</Text>
                <Text style={styles.guestDescription}>View and search hospital services and prices</Text>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleGuestLogin}
                  disabled={isLoading} // Disable while loading
                >
                  <Text style={styles.buttonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Admin Tab
              <View style={styles.tabContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Admin Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin email"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading} // Disable input while loading
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading} // Disable input while loading
                  />
                </View>

                {/* Security Warning - You might remove this later */}
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>Ensure you have created an admin user in your Supabase project.</Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleAdminLogin}
                  disabled={isLoading} // Disable button while loading
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" /> // Show spinner
                  ) : (
                    <Text style={styles.buttonText}>Login as Admin</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same, adding styles for disabled state
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#71717a",
  },
  cardContent: {
    padding: 24,
  },
  tabsList: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#e4e4e7",
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabContent: {
    marginTop: 24,
    gap: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  guestDescription: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    marginBottom: 16,
  },
  inputGroup: {
    width: "100%",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3f3f46",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#ffffff", // Ensure background for disabled state
  },
  button: {
    height: 44,
    backgroundColor: "#09090b",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a1a1aa", // Gray out button when loading
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  warningBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
  },
});
