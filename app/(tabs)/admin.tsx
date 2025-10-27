import { CategoryRow, ServiceInsert, ServiceRow, ServiceUpdate, supabase } from "@/src/lib/supabaseClient"; // Import Supabase
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react"; // Added useCallback
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Define the type for a service locally (can extend Supabase type if needed)
interface LocalService extends ServiceRow {}
interface LocalCategory extends CategoryRow {}

// Empty form state
const emptyForm: Omit<ServiceInsert, "category_id"> & { category_id: string | null; price: string } = {
  name: "",
  category_id: null,
  price: "",
  description: "",
};

export default function AdminScreen() {
  const router = useRouter();
  const [services, setServices] = useState<LocalService[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]); // State for categories
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For modal save button

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);
  // Explicitly type formData based on our modified structure
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);

  // --- Fetch Data from Supabase ---
  const fetchData = useCallback(async () => {
    console.log("AdminScreen: Fetching data from Supabase...");
    setLoading(true);
    try {
      // Check session again for safety, though layout should handle redirects
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log("AdminScreen: No session found during fetch, redirecting.");
        router.replace("/");
        return;
      }

      // Fetch categories and services concurrently
      const [{ data: fetchedCategories, error: catError }, { data: fetchedServices, error: servError }] = await Promise.all([supabase.from("categories").select("*").order("name"), supabase.from("services").select("*").order("name")]);

      if (catError) throw catError;
      if (servError) throw servError;

      setCategories(fetchedCategories || []);
      setServices(fetchedServices || []);
      console.log(`AdminScreen: Fetched ${fetchedCategories?.length || 0} categories and ${fetchedServices?.length || 0} services.`);
    } catch (error: any) {
      console.error("AdminScreen: Error fetching data:", error);
      Alert.alert("Error", `Could not fetch data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData(); // Fetch data on initial mount

    // Listen for logout events (redundant safety with layout, but good practice)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, fetchData]); // Include fetchData in dependency array
  // --- End Fetch Data ---

  // --- Handle Form Submit (Add/Update) ---
  const handleFormSubmit = async () => {
    if (!formData.name || !formData.category_id || !formData.price) {
      Alert.alert("Missing Fields", "Please fill in name, category, and price.");
      return;
    }

    setIsSubmitting(true);
    const priceNumber = parseFloat(formData.price);
    if (isNaN(priceNumber)) {
      Alert.alert("Invalid Price", "Please enter a valid number for the price.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingService) {
        // --- Update Service ---
        const serviceUpdate: ServiceUpdate = {
          name: formData.name,
          category_id: formData.category_id,
          price: priceNumber,
          description: formData.description || null, // Ensure null if empty
          updated_at: new Date().toISOString(), // Update timestamp
        };

        const { error } = await supabase.from("services").update(serviceUpdate).eq("id", editingService.id);

        if (error) throw error;
        Alert.alert("Service Updated", `${formData.name} updated.`);
      } else {
        // --- Add New Service ---
        const serviceInsert: ServiceInsert = {
          name: formData.name,
          category_id: formData.category_id,
          price: priceNumber,
          description: formData.description || null, // Ensure null if empty
          // id, created_at, updated_at are handled by DB
        };

        const { error } = await supabase.from("services").insert(serviceInsert);

        if (error) throw error;
        Alert.alert("Service Added", `${serviceInsert.name} added.`);
      }

      closeModal();
      await fetchData(); // Refetch data after successful operation
    } catch (error: any) {
      console.error("AdminScreen: Error saving service:", error);
      Alert.alert("Error", `Could not save service: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Handle Form Submit ---

  // --- Handle Delete Service ---
  const handleDeleteService = (id: string) => {
    const service = services.find((s) => s.id === id);
    Alert.alert("Delete Service", `Are you sure you want to delete "${service?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Make async
          try {
            const { error } = await supabase.from("services").delete().eq("id", id);

            if (error) throw error;

            Alert.alert("Service Deleted", `${service?.name} removed.`);
            await fetchData(); // Refetch data after delete
          } catch (error: any) {
            console.error("AdminScreen: Error deleting service:", error);
            Alert.alert("Error", `Could not delete service: ${error.message || "Unknown error"}`);
          }
        },
      },
    ]);
  };
  // --- End Handle Delete ---

  // --- Modal Logic (No changes needed, but ensure category_id is used) ---
  const openModal = (service: LocalService | null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category_id: service.category_id, // Use category_id
        price: service.price.toString(),
        description: service.description || "", // Handle null description
      });
    } else {
      setEditingService(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData(emptyForm);
  };
  // --- End Modal Logic ---

  // --- Handle Logout ---
  const handleLogout = async () => {
    setIsLoading(true); // Show loading during sign out
    const { error } = await supabase.auth.signOut();
    // The onAuthStateChange listener in the layout will handle the redirect
    if (error) {
      Alert.alert("Logout Failed", error.message);
      setIsLoading(false);
    } else {
      // Redirect might happen via listener, but force it just in case
      router.replace("/");
    }
  };
  // --- End Handle Logout ---

  // --- Render Admin Item ---
  const renderAdminItem = ({ item }: { item: LocalService }) => {
    const category = categories.find((c) => c.id === item.category_id); // Use category_id
    return (
      <AdminServiceCard
        service={item}
        category={category} // Pass the found category object
        onEdit={() => openModal(item)}
        onDelete={() => handleDeleteService(item.id)}
      />
    );
  };
  // --- End Render Admin Item ---

  // Show loading indicator during initial fetch or logout
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Loading Admin Data...</Text>
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
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/services")}>
          <Text style={styles.headerButtonText}>{"← Services"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <Text style={[styles.headerButtonText, styles.logoutButtonText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <FlatList
        data={services}
        renderItem={renderAdminItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Manage Services</Text>
              <Text style={styles.listSubtitle}>Add, edit, or remove hospital services</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal(null)}>
              <Text style={styles.addButtonText}>+ Add Service</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services found. Add one!</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingService ? "Edit Service" : "Add New Service"}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Name</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="e.g., Chest X-Ray" />
            </View>

            {/* Real Category Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.pickerButton,
                        formData.category_id === cat.id && styles.pickerButtonActive, // Use category_id
                      ]}
                      onPress={() => setFormData({ ...formData, category_id: cat.id })} // Set category_id
                    >
                      <Text style={[styles.pickerButtonText, formData.category_id === cat.id && styles.pickerButtonTextActive]}>
                        {/* Find icon from mock data if needed, or add icon to CategoryRow */}
                        {/* {mockCategories.find(mc => mc.id === cat.id)?.icon} {cat.name} */}
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noCategoriesText}>No categories found.</Text>
                )}
              </View>
              {!formData.category_id && <Text style={styles.errorText}>Please select a category.</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, "") })} // Allow only numbers and dot
                placeholder="0.00"
                keyboardType="numeric"
              />
              {isNaN(parseFloat(formData.price)) && formData.price !== "" && <Text style={styles.errorText}>Invalid price.</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={formData.description || ""} // Handle null value
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Service description (optional)"
                multiline
              />
            </View>
            <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>{editingService ? "Update Service" : "Add Service"}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// --- Admin Service Card Component ---
// (Moved AdminServiceCard here as it's only used in this screen)
const AdminServiceCard = ({ service, category, onEdit, onDelete }: { service: LocalService; category: LocalCategory | undefined; onEdit: () => void; onDelete: () => void }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          {/* If you add icons to your DB categories, display here */}
          {/* <Text style={styles.cardIcon}>?</Text>  */}
          <Text style={styles.cardCategoryName}>{category?.name || "Uncategorized"}</Text>
        </View>
        <Text style={styles.cardTitle}>{service.name}</Text>
        {service.description && <Text style={styles.cardDescription}>{service.description}</Text>}
      </View>
      <View style={styles.cardActions}>
        <Text style={styles.cardPrice}>${service.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);
// --- End Admin Service Card ---

// Stylesheet (Additions: loading, error, empty, submit disabled, no categories)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f5", // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  header: {
    backgroundColor: "#ffffff", // White header
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, // Thin border
    borderBottomColor: "#D1D1D6", // iOS separator color
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Removed marginTop, SafeAreaView handles top space
  },
  headerTitle: {
    fontSize: 17, // iOS title size
    fontWeight: "600", // Semibold
  },
  headerButton: {
    padding: 8, // Make touch target larger
  },
  headerButtonText: {
    fontSize: 17, // iOS button text size
    color: "#007AFF", // iOS blue
  },
  logoutButtonText: {
    color: "#FF3B30", // iOS red for destructive/logout actions
  },
  listContainer: {
    padding: 16,
    gap: 16, // More space between cards
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // More space below header
  },
  listTitle: {
    fontSize: 28, // Larger title
    fontWeight: "bold",
  },
  listSubtitle: {
    fontSize: 15,
    color: "#8E8E93", // iOS secondary text color
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600", // Semibold
    fontSize: 17,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1, // Make it take available space if list is short
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  // Card styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10, // Slightly less rounded corners
    // iOS shadow:
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3, // Android shadow
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "flex-start", // Align items to the top
  },
  cardMain: {
    flex: 1, // Takes up available space
    marginRight: 16, // Space before price/actions
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    // Added style for icon if you add it later
    fontSize: 16,
    color: "#8E8E93",
  },
  cardCategoryName: {
    fontSize: 13, // Standard iOS secondary text size
    fontWeight: "500",
    color: "#8E8E93",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 17, // Standard iOS body text size
    fontWeight: "600", // Semibold
    marginBottom: 4,
    color: "#000000", // Ensure black text
  },
  cardDescription: {
    fontSize: 15, // Standard iOS footnote size
    color: "#3C3C43", // iOS tertiary text color
    lineHeight: 20,
  },
  cardActions: {
    alignItems: "flex-end", // Align price and buttons to the right
    justifyContent: "space-between", // Space out price and buttons vertically
    minHeight: 60, // Give space even if no description
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12, // More space above buttons
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10, // Space between buttons
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    borderColor: "#007AFF",
  },
  deleteButton: {
    borderColor: "#FF3B30",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  deleteButtonText: {
    color: "#FF3B30",
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS modal background color
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
    backgroundColor: "#F7F7F7", // Slightly different header background
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalCloseButton: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "500", // Regular weight for cancel
  },
  modalBody: {
    flex: 1, // Takes remaining space
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20, // More space between form groups
    gap: 6,
  },
  label: {
    fontSize: 13, // Smaller label size
    color: "#6D6D72", // iOS label color
    textTransform: "uppercase",
  },
  input: {
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C6C6C8", // iOS input border color
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    backgroundColor: "#ffffff", // White input background
  },
  textarea: {
    minHeight: 100, // Ensure good height for multiline
    textAlignVertical: "top", // Start text from top
    paddingTop: 12, // Padding inside textarea
  },
  submitButton: {
    height: 50, // Taller button
    backgroundColor: "#007AFF",
    borderRadius: 10, // More rounded corners
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24, // Space above submit button
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#A9A9A9", // Gray out when disabled
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  // Picker (Select) replacement - iOS style Segmented Control appearance
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow wrapping
    gap: 8, // Space between buttons
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#007AFF", // Blue border
    borderRadius: 8,
    backgroundColor: "#ffffff", // White background
  },
  pickerButtonActive: {
    backgroundColor: "#007AFF", // Blue background when active
  },
  pickerButtonText: {
    fontSize: 15,
    color: "#007AFF", // Blue text
  },
  pickerButtonTextActive: {
    color: "#ffffff", // White text when active
    fontWeight: "600",
  },
  noCategoriesText: {
    fontSize: 15,
    color: "#8E8E93",
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#FF3B30", // iOS red for errors
    marginTop: 4,
  },
});
