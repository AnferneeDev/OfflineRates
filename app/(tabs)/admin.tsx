import { CategoryRow, ServiceInsert, ServiceRow, ServiceUpdate, supabase } from "@/src/lib/supabaseClient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type LocalService = ServiceRow;
type LocalCategory = CategoryRow;

const emptyForm = {
  name: "",
  category_id: null as string | null,
  price: "",
  description: "",
};

export default function AdminScreen() {
  const router = useRouter();
  const [services, setServices] = useState<LocalService[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    console.log("AdminScreen: Fetching data from Supabase...");
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log("AdminScreen: No session found during fetch, redirecting.");
        setImmediate(() => {
          router.replace("/");
        });
        return;
      }

      // select("*") will include the new 'icon' column
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
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setImmediate(() => {
          router.replace("/");
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchData, router]);

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
        const serviceUpdate: ServiceUpdate = {
          name: formData.name,
          category_id: formData.category_id,
          price: priceNumber,
          description: formData.description || null,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("services").update(serviceUpdate).eq("id", editingService.id);
        if (error) throw error;
        Alert.alert("Service Updated", `${formData.name} updated.`);
      } else {
        const serviceInsert: ServiceInsert = {
          name: formData.name,
          category_id: formData.category_id,
          price: priceNumber,
          description: formData.description || null,
        };
        const { error } = await supabase.from("services").insert(serviceInsert);
        if (error) throw error;
        Alert.alert("Service Added", `${serviceInsert.name} added.`);
      }
      closeModal();
      await fetchData();
    } catch (error: any) {
      console.error("AdminScreen: Error saving service:", error);
      Alert.alert("Error", `Could not save service: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = (id: string) => {
    const service = services.find((s) => s.id === id);
    Alert.alert("Delete Service", `Are you sure you want to delete "${service?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("services").delete().eq("id", id);
            if (error) throw error;
            Alert.alert("Service Deleted", `${service?.name} removed.`);
            await fetchData();
          } catch (error: any) {
            console.error("AdminScreen: Error deleting service:", error);
            Alert.alert("Error", `Could not delete service: ${error.message || "Unknown error"}`);
          }
        },
      },
    ]);
  };

  const openModal = (service: LocalService | null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category_id: service.category_id,
        price: service.price.toString(),
        description: service.description || "",
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

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout Failed", error.message);
      setLoading(false);
    } else {
      setImmediate(() => {
        router.replace("/");
      });
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const renderAdminItem = ({ item }: { item: LocalService }) => {
    const category = categories.find((c) => c.id === item.category_id);
    return <AdminServiceCard service={item} category={category} onEdit={() => openModal(item)} onDelete={() => handleDeleteService(item.id)} />;
  };

  const filteredServices = services.filter((service) => {
    const category = categories.find((c) => c.id === service.category_id);
    const categoryName = category ? category.name : "";
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = service.name.toLowerCase().includes(searchLower) || (service.description && service.description.toLowerCase().includes(searchLower)) || categoryName.toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategories.length === 0 || (service.category_id && selectedCategories.includes(service.category_id));

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-100">
        <View className="flex-1 justify-center items-center gap-2.5">
          <ActivityIndicator size="large" />
          <Text>Loading Admin Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-100">
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#ffffff" hidden={false} />

      <View className="bg-white pt-12 pb-2.5 px-4 border-b border-zinc-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[22px] font-bold">Manage Services</Text>
          <View className="flex-row gap-2 items-center">
            <TouchableOpacity className="bg-blue-500 h-10 px-4 rounded-lg flex-row items-center gap-1.5" onPress={() => openModal(null)}>
              <Feather name="plus" size={18} color="#ffffff" />
              <Text className="text-white font-semibold text-base">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity className="h-10 w-10 justify-center items-center rounded-lg bg-zinc-100 border border-zinc-400" onPress={handleLogout}>
              <Feather name="log-out" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-2 items-center">
          <View className="flex-1 flex-row items-center bg-zinc-300 rounded-lg px-3.5 h-14">
            <Feather name="search" size={20} color="#71717a" className="mr-2" />
            <TextInput className="flex-1 h-full px-2 text-base" placeholder="Search services..." value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1 ml-1">
                <Text className="text-sm text-zinc-500">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity className="h-14 px-4 justify-center items-center rounded-lg bg-zinc-100 border border-zinc-400 flex-row gap-2" onPress={() => setIsFilterModalVisible(true)}>
            <Feather name="filter" size={16} color="#000000" />
            <Text className="text-sm font-semibold text-black">FILTER</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredServices}
        renderItem={renderAdminItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-16">
            <Text className="text-base text-zinc-500 text-center">{searchQuery.length > 0 ? "No services match your search." : "No services found. Add one!"}</Text>
          </View>
        }
      />

      <Modal visible={isModalOpen} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView className="flex-1 bg-zinc-50">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-zinc-200 bg-zinc-100">
            <Text className="text-xl font-semibold">{editingService ? "Edit Service" : "Add New Service"}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text className="text-base text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            <View className="mb-5 gap-1.5">
              <Text className="text-[13px] text-zinc-500 uppercase">Service Name</Text>
              <TextInput className="h-11 border border-zinc-300 rounded-lg px-3 text-base bg-white" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="e.g., Chest X-Ray" />
            </View>

            <View className="mb-5 gap-1.5">
              <Text className="text-[13px] text-zinc-500 uppercase">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      className={`py-2.5 px-3.5 border rounded-lg ${formData.category_id === cat.id ? "border-blue-500 bg-blue-500" : "border-blue-500 bg-white"}`}
                      onPress={() => setFormData({ ...formData, category_id: cat.id })}
                    >
                      <Text className={`text-[15px] ${formData.category_id === cat.id ? "text-white font-semibold" : "text-blue-500"}`}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-[15px] text-zinc-500 py-2.5">No categories found.</Text>
                )}
              </View>
              {!formData.category_id && <Text className="text-[13px] text-red-500 mt-1">Please select a category.</Text>}
            </View>

            <View className="mb-5 gap-1.5">
              <Text className="text-[13px] text-zinc-500 uppercase">Price ($)</Text>
              <TextInput
                className="h-11 border border-zinc-300 rounded-lg px-3 text-base bg-white"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, "") })}
                placeholder="0.00"
                keyboardType="numeric"
              />
              {isNaN(parseFloat(formData.price)) && formData.price !== "" && <Text className="text-[13px] text-red-500 mt-1">Invalid price.</Text>}
            </View>

            <View className="mb-5 gap-1.5">
              <Text className="text-[13px] text-zinc-500 uppercase">Description</Text>
              <TextInput
                className="min-h-[100px] border border-zinc-300 rounded-lg px-3 pt-3 text-base bg-white"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Service description (optional)"
                multiline
              />
            </View>

            <TouchableOpacity className={`h-[50px] rounded-[10px] justify-center items-center mt-6 shadow-sm ${isSubmitting ? "bg-zinc-400" : "bg-blue-500"}`} onPress={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-base font-semibold">{editingService ? "Update Service" : "Add Service"}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={isFilterModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsFilterModalVisible(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsFilterModalVisible(false)} />
          <View className="bg-white max-h-[75%] rounded-t-[20px] overflow-hidden pt-2">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-zinc-200">
              <Text className="text-lg font-semibold">Filter by Category</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Text className="text-base text-blue-500 font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-4 pb-4">
              {categories.map((category) => (
                <Checkbox key={category.id} label={category.name} icon={category.icon || "?"} value={selectedCategories.includes(category.id)} onToggle={() => handleCategoryToggle(category.id)} />
              ))}
            </ScrollView>
            {selectedCategories.length > 0 && (
              <TouchableOpacity className="h-11 justify-center items-center rounded-lg bg-zinc-100 mx-4 mb-4 mt-2" onPress={() => setSelectedCategories([])}>
                <Text className="text-base font-medium text-blue-500">Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const AdminServiceCard = ({ service, category, onEdit, onDelete }: { service: LocalService; category: LocalCategory | undefined; onEdit: () => void; onDelete: () => void }) => (
  <View className="bg-white rounded-[10px] shadow-sm">
    <View className="flex-row justify-between p-4">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-[13px] font-medium text-zinc-500 uppercase">{category?.name || "Uncategorized"}</Text>
        </View>
        <Text className="text-base font-semibold mb-1">{service.name}</Text>
        {service.description && <Text className="text-[15px] text-zinc-600 leading-5">{service.description}</Text>}
      </View>
      <View className="items-end justify-between min-h-[60px]">
        <Text className="text-lg font-bold text-blue-500 mb-3">${service.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View className="flex-row gap-2.5">
          <TouchableOpacity className="h-9 w-9 justify-center items-center rounded-md border border-blue-500" onPress={onEdit}>
            <Feather name="edit-2" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="h-9 w-9 justify-center items-center rounded-md border border-red-500" onPress={onDelete}>
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

const Checkbox = ({ label, icon, value, onToggle }: { label: string; icon: string; value: boolean; onToggle: () => void }) => (
  <TouchableOpacity className="flex-row items-center py-3.5 border-b border-zinc-200" onPress={onToggle}>
    <View className={`w-5 h-5 border-2 rounded-md mr-4 justify-center items-center ${value ? "bg-blue-500 border-blue-500" : "border-zinc-400"}`}>{value && <Text className="text-white text-xs font-bold">✓</Text>}</View>
    <Text className="text-base flex-1">
      {icon} {label}
    </Text>
  </TouchableOpacity>
);
