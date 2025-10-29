import { CategoryRow, ServiceInsert, ServiceRow, ServiceUpdate, supabase } from "@/src/lib/supabaseClient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  // In useEffect:
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

  useEffect(() => {
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setTimeout(() => {
          router.replace("/");
        }, 100);
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

  const renderAdminItem = ({ item }: { item: LocalService }) => {
    const category = categories.find((c) => c.id === item.category_id);
    return <AdminServiceCard service={item} category={category} onEdit={() => openModal(item)} onDelete={() => handleDeleteService(item.id)} />;
  };

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
      <StatusBar
        barStyle="dark-content" // Use "light-content" for a dark background
        translucent={false}
        backgroundColor="#555555" // Set to black
        hidden={true}
      />
      <View className="bg-white px-4 py-3 border-b border-zinc-300 flex-row justify-between items-center">
        <TouchableOpacity className="p-2" onPress={() => router.push("/services")}>
          <Text className="text-base text-blue-500 font-medium">← Services</Text>
        </TouchableOpacity>
        <Text className="text-base font-semibold">Admin Dashboard</Text>
        <TouchableOpacity className="p-2" onPress={handleLogout}>
          <Text className="text-base text-red-500 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderAdminItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        ListHeaderComponent={
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Text className="text-[28px] font-bold">Manage Services</Text>
              <Text className="text-[15px] text-zinc-500 mt-1">Add, edit, or remove hospital services</Text>
            </View>
            <TouchableOpacity className="bg-blue-500 py-2.5 px-4 rounded-lg flex-row items-center" onPress={() => openModal(null)}>
              <Text className="text-white font-semibold text-base ml-1">+ Add Service</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-16">
            <Text className="text-base text-zinc-500 text-center">No services found. Add one!</Text>
          </View>
        }
      />

      <Modal visible={isModalOpen} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView className="flex-1 bg-zinc-50">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-zinc-200 bg-zinc-100">
            <Text className="text-base font-semibold">{editingService ? "Edit Service" : "Add New Service"}</Text>
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
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity className={`h-[50px] rounded-[10px] justify-center items-center mt-6 shadow-sm ${isSubmitting ? "bg-zinc-400" : "bg-blue-500"}`} onPress={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-base font-semibold">{editingService ? "Update Service" : "Add Service"}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
        <Text className="text-base font-semibold mb-3">${service.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View className="flex-row gap-2.5">
          <TouchableOpacity className="py-1.5 px-3 rounded-md border border-blue-500" onPress={onEdit}>
            <Text className="text-[15px] font-medium text-blue-500">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-1.5 px-3 rounded-md border border-red-500" onPress={onDelete}>
            <Text className="text-[15px] font-medium text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);
