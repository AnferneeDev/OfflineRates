import { categories as mockCategories } from "@/src/data/services"; // Use mock categories for filter UI initially
import { Category, fetchLocalCategories, fetchLocalServices, ServiceWithCategory, syncDatabase } from "@/src/lib/database"; // Import syncDatabase and fetchLocalCategories
import { supabase } from "@/src/lib/supabaseClient"; // Import Supabase client
import { useNetInfo } from "@react-native-community/netinfo"; // Import NetInfo
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Mock Auth Context (replace with your real one)
// TODO: Replace this with a real Auth Context implementation
const useAuth = () => ({
  isAuthenticated: true, // Keep this true for now to allow access
  userRole: "guest", // 'guest' or 'admin' - set to guest
  logout: () => console.log("logout"),
});

// Service Card Component (No changes needed)
const ServiceCard = ({ service }: { service: ServiceWithCategory }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>{mockCategories.find((c) => c.id === service.category_id)?.icon || "?"}</Text>
      <Text style={styles.cardCategory}>{service.category_name || "Uncategorized"}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardDescription}>{service.description}</Text>
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.cardPrice}>${service.price.toLocaleString()}</Text>
    </View>
  </View>
);

// Checkbox Component (No changes needed)
const Checkbox = ({ label, icon, value, onToggle }: { label: string; icon: string; value: boolean; onToggle: () => void }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle}>
    <View style={[styles.checkboxBase, value && styles.checkboxChecked]}>{value && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
    <Text style={styles.checkboxLabel}>
      {icon} {label}
    </Text>
  </TouchableOpacity>
);

export default function ServicesScreen() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const router = useRouter();
  const netInfo = useNetInfo(); // Get network state

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]); // Will load from DB or mock
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // Add syncing state
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    async function loadInitialData() {
      console.log("ServicesScreen: Starting initial data load...");
      setIsLoading(true);
      setIsSyncing(false); // Reset syncing state

      try {
        // --- STEP 1: Check Internet and Sync if Online ---
        if (netInfo.isConnected === true) {
          // Explicit check for true
          console.log("ServicesScreen: Online. Attempting to sync...");
          setIsSyncing(true); // Indicate syncing process
          // Fetch latest data from Supabase
          const { data: supabaseCategories, error: catError } = await supabase.from("categories").select("*");
          const { data: supabaseServices, error: servError } = await supabase.from("services").select("*");

          if (catError || servError) {
            console.error("ServicesScreen: Error fetching from Supabase:", catError || servError);
            Alert.alert("Sync Error", "Could not fetch latest data from server. Using local data.");
            // Proceed to load local data even if sync fails
          } else {
            console.log("ServicesScreen: Fetched from Supabase. Syncing local DB...");
            // Sync local database with fetched data
            // Ensure data structure matches expected types for syncDatabase
            await syncDatabase(supabaseCategories || [], supabaseServices || []);
            console.log("ServicesScreen: Local DB synced.");
          }
          setIsSyncing(false); // Syncing finished (success or fail)
        } else if (netInfo.isConnected === false) {
          // Explicit check for false
          console.log("ServicesScreen: Offline. Loading local data only.");
          // Optionally show an offline indicator to the user
        }
        // If netInfo.isConnected is null (still determining), we'll just load local below

        // --- STEP 2: Load Data from Local DB (always happens after sync attempt or if offline) ---
        console.log("ServicesScreen: Fetching local services and categories...");
        const [fetchedServices, fetchedCategories] = await Promise.all([
          fetchLocalServices(),
          fetchLocalCategories(), // Fetch categories from local DB
        ]);
        console.log(`ServicesScreen: Fetched ${fetchedServices.length} services and ${fetchedCategories.length} categories locally.`);
        setServices(fetchedServices);
        setLocalCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories); // Use fetched or fallback to mock
      } catch (error) {
        console.error("ServicesScreen: Error during data load/sync:", error);
        Alert.alert("Error", "Could not load service data.");
        setServices([]); // Clear services on error
        setLocalCategories(mockCategories); // Fallback to mock categories
      } finally {
        setIsLoading(false);
        setIsSyncing(false); // Ensure syncing is false on final exit
        console.log("ServicesScreen: Initial data load finished.");
      }
    }

    // Only run loadInitialData if NetInfo is determined (not null)
    // This prevents running sync logic before connectivity is known
    if (netInfo.isConnected !== null) {
      loadInitialData();
    } else {
      console.log("ServicesScreen: Waiting for network state...");
      // Still show loading while waiting for NetInfo
    }
  }, [isAuthenticated, router, netInfo.isConnected]); // Re-run when connection status changes or auth changes

  // --- Handlers and Filtering Logic (No changes needed) ---
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleLogout = () => {
    logout();
    // TODO: Implement real Supabase logout
    router.replace("/");
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.category_name && service.category_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategories.length === 0 || (service.category_id && selectedCategories.includes(service.category_id));

    return matchesSearch && matchesCategory;
  });

  const renderService = ({ item }: { item: ServiceWithCategory }) => {
    return <ServiceCard service={item} />;
  };
  // --- End Handlers and Filtering ---

  // Show loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>{isSyncing ? "Syncing latest data..." : "Loading Services..."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main UI
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        {/* Show offline indicator */}
        {netInfo.isConnected === false && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Hospital Services</Text>
          <View style={styles.headerButtons}>
            {userRole === "admin" && (
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/admin")}>
                <Text style={styles.headerButtonText}>⚙️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <Text style={styles.headerButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="Search services or categories..." value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
            <Text style={styles.filterIcon}>FILTER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{services.length === 0 ? "No services found in the database." : "No services match your criteria."}</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsFilterModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Text style={styles.modalCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {localCategories.map((category) => (
                <Checkbox
                  key={category.id}
                  label={category.name}
                  // Find icon from mock data based on name/id match if needed
                  icon={mockCategories.find((mc) => mc.id === category.id)?.icon || "?"}
                  value={selectedCategories.includes(category.id)}
                  onToggle={() => handleCategoryToggle(category.id)}
                />
              ))}
            </ScrollView>
            {selectedCategories.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedCategories([])}>
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Stylesheet (Added offline banner style)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  offlineBanner: {
    // Style for offline indicator
    backgroundColor: "#FFA500", // Orange color for warning
    paddingVertical: 4,
    alignItems: "center",
    marginBottom: 8, // Space below banner
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: StatusBar.currentHeight ? 10 : 20, // Adjust top padding, removed status bar height addition here, handle in SafeAreaView potentially
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFF4",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchIcon: {
    fontSize: 16,
    color: "#8E8E93",
    marginRight: 6,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 4,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: "#8E8E93",
  },
  filterButton: {
    height: 38,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#EFEFF4",
  },
  filterIcon: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32, // Ensure space at the bottom
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#71717a",
    textAlign: "center",
  },
  // Card styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717a",
    textTransform: "uppercase",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#3f3f46",
    lineHeight: 20,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#09090b",
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    maxHeight: "75%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  clearButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#EFEFF4",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  clearButtonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#007AFF",
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
  },
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  checkboxChecked: {},
  checkboxCheckmark: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },
  checkboxLabel: {
    fontSize: 17,
    flex: 1,
  },
});
