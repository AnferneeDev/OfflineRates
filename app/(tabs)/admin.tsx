import { categories, hospitalServices as initialServices } from "@/src/data/services";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  userRole: "admin", // 'guest' or 'admin'
  logout: () => console.log("logout"),
});

// Empty form state
const emptyForm = {
  name: "",
  category: "",
  price: "",
  description: "",
};

export default function AdminScreen() {
  const { userRole, logout } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    // This is the mock for checking auth and loading data.
    if (userRole !== "admin") {
      router.replace("/"); // Go back to login
      return;
    }
    // We replaced localStorage with a simple useState.
    setServices(initialServices);
  }, [userRole, router]);

  const saveServices = (updatedServices: Service[]) => {
    // In a real app, this would update our global state or database
    // For this demo, we just update the local component state
    setServices(updatedServices);
    // localStorage.setItem("hospital_services", JSON.stringify(updatedServices));
  };

  const handleFormSubmit = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.description) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }

    if (editingService) {
      // --- Update Service ---
      const updatedServices = services.map((service) =>
        service.id === editingService.id
          ? {
              ...service,
              name: formData.name,
              category: formData.category,
              price: parseFloat(formData.price),
              description: formData.description,
            }
          : service
      );
      saveServices(updatedServices);
      Alert.alert("Service Updated", `${formData.name} has been updated`);
    } else {
      // --- Add New Service ---
      const newService: Service = {
        id: Date.now().toString(), // Mock ID
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
      };
      saveServices([...services, newService]);
      Alert.alert("Service Added", `${newService.name} has been added`);
    }

    closeModal();
  };

  const handleDeleteService = (id: string) => {
    const service = services.find((s) => s.id === id);
    // Show a confirmation dialog
    Alert.alert("Delete Service", `Are you sure you want to delete "${service?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedServices = services.filter((s) => s.id !== id);
          saveServices(updatedServices);
          Alert.alert("Service Deleted", `${service?.name} has been removed`);
        },
      },
    ]);
  };

  const openModal = (service: Service | null) => {
    if (service) {
      // Edit mode
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category,
        price: service.price.toString(),
        description: service.description,
      });
    } else {
      // Add mode
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

  const handleLogout = () => {
    logout();
    router.replace("/");
    Alert.alert("Logged Out", "You have been logged out successfully");
  };

  // This is how we render each item in the FlatList
  const renderAdminItem = ({ item }: { item: Service }) => {
    const category = categories.find((c) => c.id === item.category);
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <Text style={styles.cardCategory}>
            {category?.icon} {category?.name}
          </Text>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
          <Text style={styles.cardPrice}>${item.price.toLocaleString()}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openModal(item)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteService(item.id)}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/(tabs)/services")}>
          <Text style={styles.headerButtonText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <Text style={styles.headerButtonText}>Logout</Text>
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
      />

      {/* Add/Edit Modal (replaces <Dialog>) */}
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

            {/* This is our replacement for <Select> */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat.id} style={[styles.pickerButton, formData.category === cat.id && styles.pickerButtonActive]} onPress={() => setFormData({ ...formData, category: cat.id })}>
                    <Text style={[styles.pickerButtonText, formData.category === cat.id && styles.pickerButtonTextActive]}>
                      {cat.icon} {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput style={styles.input} value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} placeholder="0.00" keyboardType="numeric" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textarea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Service description" multiline />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit}>
              <Text style={styles.submitButtonText}>{editingService ? "Update Service" : "Add Service"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  listSubtitle: {
    fontSize: 14,
    color: "#71717a",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 16,
  },
  // Card styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  cardBody: {
    padding: 16,
    gap: 4,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717a",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 14,
    color: "#3f3f46",
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#09090b",
    marginTop: 8,
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: "#e4e4e7",
  },
  deleteButton: {},
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
  deleteButtonText: {
    color: "#ef4444",
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalCloseButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
    backgroundColor: "#fff",
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
    paddingVertical: 12,
  },
  submitButton: {
    height: 44,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Picker (Select) replacement
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 20,
  },
  pickerButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#09090b",
  },
  pickerButtonTextActive: {
    color: "#ffffff",
  },
});
