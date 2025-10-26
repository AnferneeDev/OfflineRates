import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// This is your new "Index" screen, which will function as the Login.
export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("guest");
  const router = useRouter();

  // --- Mock Auth & Navigation Logic ---
  // We'll replace this with your real context later.
  // For now, this makes the component work.

  const login = (user: string, pass: string) => {
    // Hardcoded credentials for the demo
    if (user === "admin" && pass === "1234") {
      return true;
    }
    return false;
  };

  const loginAsGuest = () => {
    // In the real app, this will set your auth context state
  };
  // --- End Mock Logic ---

  const handleAdminLogin = () => {
    const success = login(username, password);
    if (success) {
      Alert.alert("Welcome Admin", "Successfully logged in as administrator");
      // We will create the (tabs) group and services screen next
      router.push("/services");
    } else {
      Alert.alert("Login Failed", "Invalid credentials. Please try again.");
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    Alert.alert("Welcome Guest", "Browsing services as a guest");
    // We will create the (tabs) group and services screen next
    router.push("/services");
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
              <TouchableOpacity style={[styles.tabButton, activeTab === "guest" && styles.tabButtonActive]} onPress={() => setActiveTab("guest")}>
                <Text style={styles.tabButtonText}>(G) Guest</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === "admin" && styles.tabButtonActive]} onPress={() => setActiveTab("admin")}>
                <Text style={styles.tabButtonText}>(A) Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs Content */}
            {activeTab === "guest" ? (
              // Guest Tab
              <View style={styles.tabContent}>
                <Text style={styles.guestTitle}>Browse as Guest</Text>
                <Text style={styles.guestDescription}>View and search hospital services and prices</Text>
                <TouchableOpacity style={styles.button} onPress={handleGuestLogin}>
                  <Text style={styles.buttonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Admin Tab
              <View style={styles.tabContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin username"
                    value={username}
                    onChangeText={setUsername} // This is the React Native way
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin password"
                    value={password}
                    onChangeText={setPassword} // This is the React Native way
                    secureTextEntry // This hides the password
                  />
                </View>

                {/* Security Warning */}
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>Security Warning: This demo uses hardcoded credentials (admin / 1234).</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                  <Text style={styles.buttonText}>Login as Admin</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

//
// This is the replacement for CSS.
//
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f5", // bg-background
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
  },
  button: {
    height: 44,
    backgroundColor: "#09090b",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
