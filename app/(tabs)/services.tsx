import { categories as mockCategories } from "@/src/data/services";
import { Category, fetchLocalCategories, fetchLocalServices, ServiceWithCategory, syncDatabase } from "@/src/lib/database";
import { supabase } from "@/src/lib/supabaseClient";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";

const useAuth = () => ({
  isAuthenticated: true,
  userRole: "guest",
  logout: () => console.log("logout"),
});

const ServiceCard = ({ service }: { service: ServiceWithCategory }) => (
  <View className="bg-white rounded-xl overflow-hidden shadow-sm">
    <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
      <Text className="text-xl">{mockCategories.find((c) => c.id === service.category_id)?.icon || "?"}</Text>
      <Text className="text-xs font-medium text-zinc-500 uppercase">{service.category_name || "Uncategorized"}</Text>
    </View>
    <View className="px-4 pb-2">
      <Text className="text-lg font-semibold mb-1">{service.name}</Text>
      <Text className="text-sm text-zinc-700 leading-5">{service.description}</Text>
    </View>
    <View className="px-4 pb-4 items-end">
      <Text className="text-2xl font-bold text-zinc-900">${service.price.toLocaleString()}</Text>
    </View>
  </View>
);

const Checkbox = ({ label, icon, value, onToggle }: { label: string; icon: string; value: boolean; onToggle: () => void }) => (
  <TouchableOpacity className="flex-row items-center py-3.5 border-b border-zinc-200" onPress={onToggle}>
    <View className="w-6 h-6 justify-center items-center mr-4">{value && <Text className="text-lg text-blue-500 font-semibold">✓</Text>}</View>
    <Text className="text-base flex-1">
      {icon} {label}
    </Text>
  </TouchableOpacity>
);

export default function ServicesScreen() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const router = useRouter();
  const netInfo = useNetInfo();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    // Remove the early return that calls router.replace
    // if (!isAuthenticated) {
    //   router.replace("/");
    //   return;
    // }

    async function loadInitialData() {
      console.log("ServicesScreen: Starting initial data load...");
      setIsLoading(true);
      setIsSyncing(false);

      try {
        if (netInfo.isConnected === true) {
          console.log("ServicesScreen: Online. Attempting to sync...");
          setIsSyncing(true);
          const { data: supabaseCategories, error: catError } = await supabase.from("categories").select("*");
          const { data: supabaseServices, error: servError } = await supabase.from("services").select("*");

          if (catError || servError) {
            console.error("ServicesScreen: Error fetching from Supabase:", catError || servError);
            Alert.alert("Sync Error", "Could not fetch latest data from server. Using local data.");
          } else {
            console.log("ServicesScreen: Fetched from Supabase. Syncing local DB...");
            await syncDatabase(supabaseCategories || [], supabaseServices || []);
            console.log("ServicesScreen: Local DB synced.");
          }
          setIsSyncing(false);
        } else if (netInfo.isConnected === false) {
          console.log("ServicesScreen: Offline. Loading local data only.");
        }

        console.log("ServicesScreen: Fetching local services and categories...");
        const [fetchedServices, fetchedCategories] = await Promise.all([fetchLocalServices(), fetchLocalCategories()]);
        console.log(`ServicesScreen: Fetched ${fetchedServices.length} services and ${fetchedCategories.length} categories locally.`);
        setServices(fetchedServices);
        setLocalCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories);
      } catch (error) {
        console.error("ServicesScreen: Error during data load/sync:", error);
        Alert.alert("Error", "Could not load service data.");
        setServices([]);
        setLocalCategories(mockCategories);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
        console.log("ServicesScreen: Initial data load finished.");
      }
    }

    if (netInfo.isConnected !== null) {
      loadInitialData();
    } else {
      console.log("ServicesScreen: Waiting for network state...");
    }
  }, [netInfo.isConnected]); // Removed isAuthenticated and router from dependencies

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleLogout = () => {
    logout();
    // Use setTimeout to ensure navigation happens after render
    setTimeout(() => {
      router.replace("/");
    }, 100);
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-100">
        <View className="flex-1 justify-center items-center gap-2.5">
          <ActivityIndicator size="large" />
          <Text>{isSyncing ? "Syncing latest data..." : "Loading Services..."}</Text>
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
      {/* Header */}
      <View className="bg-white pt-2.5 pb-2.5 px-4 border-b border-zinc-200">
        {netInfo.isConnected === false && (
          <View className="bg-orange-500 py-1 items-center mb-2">
            <Text className="text-white text-xs font-medium">Offline Mode</Text>
          </View>
        )}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[22px] font-bold">Hospital Services</Text>
          <View className="flex-row gap-2">
            {userRole === "admin" && (
              <TouchableOpacity className="p-2" onPress={() => router.push("/admin")}>
                <Text className="text-base text-blue-500 font-medium">⚙️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="p-2" onPress={handleLogout}>
              <Text className="text-base text-blue-500 font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-2 items-center">
          <View className="flex-1 flex-row items-center bg-zinc-100 rounded-[10px] px-2.5 h-[38px]">
            <Text className="text-base text-zinc-500 mr-1.5">🔍</Text>
            <TextInput className="flex-1 h-full px-2 text-base" placeholder="Search services or categories..." value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1 ml-1">
                <Text className="text-sm text-zinc-500">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity className="h-[38px] px-3 justify-center items-center rounded-lg bg-zinc-100" onPress={() => setIsFilterModalVisible(true)}>
            <Text className="text-sm font-semibold text-blue-500">FILTER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-base text-zinc-500 text-center">{services.length === 0 ? "No services found in the database." : "No services match your criteria."}</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsFilterModalVisible(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity className="absolute inset-0" onPress={() => setIsFilterModalVisible(false)} />
          <View className="bg-white max-h-[75%] rounded-t-[20px] overflow-hidden">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-zinc-200">
              <Text className="text-lg font-semibold">Filter by Category</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Text className="text-base text-blue-500 font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-4 pb-4">
              {localCategories.map((category) => (
                <Checkbox key={category.id} label={category.name} icon={mockCategories.find((mc) => mc.id === category.id)?.icon || "?"} value={selectedCategories.includes(category.id)} onToggle={() => handleCategoryToggle(category.id)} />
              ))}
            </ScrollView>
            {selectedCategories.length > 0 && (
              <TouchableOpacity className="h-11 justify-center items-center rounded-lg bg-zinc-100 mx-4 mb-4" onPress={() => setSelectedCategories([])}>
                <Text className="text-base font-medium text-blue-500">Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
