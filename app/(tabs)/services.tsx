import { categories as mockCategories } from "@/src/data/services";
// MODIFIED: Import Service type
import { Category, fetchLocalCategories, fetchLocalServices, Service, ServiceWithCategory, syncDatabase } from "@/src/lib/database";
import { supabase } from "@/src/lib/supabaseClient";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const useAuth = () => ({
  isAuthenticated: true,
  userRole: "guest",
  logout: () => console.log("logout"),
});

// --- ServiceCard (No Changes) ---
const ServiceCard = ({ service }: { service: ServiceWithCategory }) => (
  <View className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
    <View className="flex-row justify-between items-start">
      {/* Left Side: Details */}
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xl">{mockCategories.find((c) => c.id === service.category_id)?.icon || "?"}</Text>
          <Text className="text-xs font-medium text-zinc-500 uppercase">{service.category_name || "Uncategorized"}</Text>
        </View>
        <Text className="text-lg font-semibold mb-1">{service.name}</Text>
        {service.description && <Text className="text-sm text-zinc-700 leading-5">{service.description}</Text>}
      </View>
      {/* Right Side: Price */}
      <View className="items-end">
        <Text className="text-2xl font-bold text-blue-500">${service.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text className="text-xs text-zinc-500">per service</Text>
      </View>
    </View>
  </View>
);
// --- END ServiceCard ---

// --- Checkbox (No Changes) ---
const Checkbox = ({ label, icon, value, onToggle }: { label: string; icon: string; value: boolean; onToggle: () => void }) => (
  <TouchableOpacity className="flex-row items-center py-3.5 border-b border-zinc-200" onPress={onToggle}>
    <View className={`w-5 h-5 border-2 rounded-md mr-4 justify-center items-center ${value ? "bg-blue-500 border-blue-500" : "border-zinc-400"}`}>{value && <Text className="text-white text-xs font-bold">✓</Text>}</View>
    <Text className="text-base flex-1">
      {icon} {label}
    </Text>
  </TouchableOpacity>
);
// --- END Checkbox ---

export default function ServicesScreen() {
  // --- FIX 1: Removed unused variables 'isAuthenticated' and 'userRole' ---
  const { logout } = useAuth();
  const router = useRouter();
  const netInfo = useNetInfo();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);

  // --- FIX 2: Changed state type to only store what's needed for the filter ---
  const [localCategories, setLocalCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
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

            // --- FIX 3: Filter AND Map to match local Service type ---
            const validCategories = (supabaseCategories || []).filter((cat): cat is Category => !!cat);

            // 1. Filter out services without a category_id
            const validServices: Service[] = (supabaseServices || [])
              .filter((serv) => !!serv.category_id) // Ensure category_id is not null
              .map((serv) => {
                // 2. Map the Supabase object to the local Service type
                return {
                  ...serv,
                  // We know category_id is not null here due to the filter
                  category_id: serv.category_id!,
                  // Convert description from (string | null) to (string | undefined)
                  description: serv.description ?? undefined,
                };
              });
            // --- END FIX 3 ---

            await syncDatabase(validCategories, validServices);
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

        // --- FIX 4: Normalize data before setting state ---
        // We only store id and name, which both Category and mockCategory have.
        const categoriesForState = fetchedCategories.length > 0 ? fetchedCategories : mockCategories;
        setLocalCategories(
          categoriesForState.map((cat) => ({
            id: cat.id,
            name: cat.name,
          }))
        );
        // --- END FIX 4 ---
      } catch (error) {
        console.error("ServicesScreen: Error during data load/sync:", error);
        Alert.alert("Error", "Could not load service data.");
        setServices([]);
        // --- FIX 5: Also normalize mockCategories on error ---
        setLocalCategories(
          mockCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
          }))
        );
        // --- END FIX 5 ---
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
  }, [netInfo.isConnected]); // Removed isAuthenticated and router

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleLogout = () => {
    logout();
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
      {/* --- NOT TOUCHED --- */}
      <StatusBar barStyle="dark-content" translucent={false} hidden={false} backgroundColor={"#fffffff"} />
      {/* Header */}
      <View className="bg-white pt-12 pb-2.5 px-4 border-b border-zinc-200">
        {netInfo.isConnected === false && (
          <View className="bg-orange-100 border border-orange-200 py-1.5 items-center mb-2 rounded">
            <Text className="text-orange-600 text-xs font-medium">Offline Mode - Data may be outdated</Text>
          </View>
        )}
        {isSyncing && (
          <View className="bg-blue-100 border border-blue-200 py-1.5 items-center mb-2 rounded flex-row justify-center gap-2">
            <ActivityIndicator size="small" />
            <Text className="text-blue-600 text-xs font-medium">Syncing latest data...</Text>
          </View>
        )}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[22px] font-bold">Hospital Services</Text>
          <View className="flex-row gap-2 items-center">
            {/* --- MODIFIED: Admin button REMOVED --- */}
            {/* --- MODIFIED: Logout button height/width changed to h-14/w-14 --- */}
            <TouchableOpacity className="h-10 w-14 justify-center items-center rounded-lg bg-zinc-100 border border-zinc-400" onPress={handleLogout}>
              <Text className="text-lg text-red-500">❌</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-2 items-center">
          {/* --- MODIFIED: Search bar height changed to h-14 --- */}
          <View className="flex-1 flex-row items-center bg-zinc-300 rounded-lg px-2.5 h-14">
            <Text className="text-base text-zinc-500 mr-1.5">🔍</Text>
            <TextInput className="flex-1 h-full px-2 text-base" placeholder="Search services..." value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1 ml-1">
                <Text className="text-sm text-zinc-500">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* --- MODIFIED: Filter button height changed to h-14 --- */}
          <TouchableOpacity className="h-14 px-3 justify-center items-center rounded-lg bg-zinc-100 border border-zinc-400" onPress={() => setIsFilterModalVisible(true)}>
            <Text className="text-sm font-semibold text-black">FILTER</Text>
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
      {/* --- FIX: Changed animationType from "slide" to "fade" --- */}
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
              {/* This map now works because localCategories is {id, name}[] */}
              {localCategories.map((category) => (
                <Checkbox key={category.id} label={category.name} icon={mockCategories.find((mc) => mc.id === category.id)?.icon || "?"} value={selectedCategories.includes(category.id)} onToggle={() => handleCategoryToggle(category.id)} />
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
