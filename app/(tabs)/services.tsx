import { categories, hospitalServices as initialServices } from "@/src/data/services";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Define the type for a service
interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}

// Mock Auth Context (replace with your real one)
const useAuth = () => ({
  isAuthenticated: true,
  userRole: "guest", // 'guest' or 'admin'
  logout: () => console.log("logout"),
});

// This is our replacement for <ServiceCard>
const ServiceCard = ({ service, category }: { service: Service; category: any }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>{category?.icon}</Text>
      <Text style={styles.cardCategory}>{category?.name}</Text>
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

// This is our replacement for the <Checkbox>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    // This is the mock for checking auth and loading data.
    // We replaced localStorage with a simple useState.
    if (!isAuthenticated) {
      router.replace("/"); // Go back to login
      return;
    }
    setServices(initialServices);
  }, [isAuthenticated, router]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleLogout = () => {
    logout();
    router.replace("/"); // Go back to login
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(service.category);
    return matchesSearch && matchesCategory;
  });

  // This is how we render each item in the FlatList
  const renderService = ({ item }: { item: Service }) => {
    const category = categories.find((c) => c.id === item.category);
    return <ServiceCard service={item} category={category} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header with Search */}
      <View style={styles.header}>
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
            <TextInput style={styles.searchInput} placeholder="Search for services..." value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.searchIcon}>X</Text>
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
            <Text style={styles.emptyText}>No services found matching your criteria.</Text>
          </View>
        }
      />

      {/* Filter Modal (replaces <Sheet>) */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Text style={styles.modalCloseButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {categories.map((category) => (
                <Checkbox key={category.id} label={category.name} icon={category.icon} value={selectedCategories.includes(category.id)} onToggle={() => handleCategoryToggle(category.id)} />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedCategories([])}>
              <Text style={styles.clearButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Basic StyleSheet
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 16,
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
    fontSize: 20,
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
    color: "#09090b",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchIcon: {
    fontSize: 16,
    color: "#71717a",
  },
  filterButton: {
    height: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  filterIcon: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#71717a",
  },
  // Card styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
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
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#3f3f46",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    height: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalCloseButton: {
    fontSize: 16,
    color: "#007AFF", // iOS blue
  },
  modalBody: {
    flex: 1,
    paddingVertical: 16,
  },
  clearButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#e4e4e7",
    marginTop: 16,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#09090b",
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#09090b",
    borderColor: "#09090b",
  },
  checkboxCheckmark: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
  },
});
