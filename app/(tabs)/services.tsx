import { categories as mockCategories } from "@/src/data/services";
import { Category, fetchLocalCategories, fetchLocalServices, Service, ServiceWithCategory, syncDatabase } from "@/src/lib/database";
import { supabase } from "@/src/lib/supabaseClient";
import { Feather } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const useAuth = () => ({
  isAuthenticated: true,
  userRole: "guest",
  logout: () => console.log("logout"),
});

const ServiceCard = ({ service }: { service: ServiceWithCategory }) => (
  <View className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
    <View className="flex-row justify-between items-start">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xl">{service.category_icon || "?"}</Text>
          <Text className="text-xs font-medium text-zinc-500 uppercase">{service.category_name || "Uncategorized"}</Text>
        </View>
        <Text className="text-lg font-semibold mb-1">{service.name}</Text>
        {service.description && <Text className="text-sm text-zinc-700 leading-5">{service.description}</Text>}
      </View>
      <View className="items-end">
        <Text className="text-2xl font-bold text-blue-500">${service.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text className="text-xs text-zinc-500">per service</Text>
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

export default function ServicesScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const netInfo = useNetInfo();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [localCategories, setLocalCategories] = useState<{ id: string; name: string; icon: string | null }[]>([]);
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
            const validCategories = (supabaseCategories || []).filter((cat): cat is Category => !!cat);
            const validServices: Service[] = (supabaseServices || [])
              .filter((serv) => !!serv.category_id)
              .map((serv) => {
                return {
                  ...serv,
                  category_id: serv.category_id!,
                  description: serv.description ?? undefined,
                };
              });

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

        const sortedServices = fetchedServices.sort((a, b) => a.name.localeCompare(b.name));
        setServices(sortedServices);

        const categoriesForState = fetchedCategories.length > 0 ? fetchedCategories : mockCategories;

        setLocalCategories(
          categoriesForState.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || null,
          }))
        );
      } catch (error) {
        console.error("ServicesScreen: Error during data load/sync:", error);
        Alert.alert("Error", "Could not load service data.");
        setServices([]);
        setLocalCategories(
          mockCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || "?",
          }))
        );
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
  }, [netInfo.isConnected]);

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
      <StatusBar barStyle="dark-content" translucent={false} hidden={false} backgroundColor={"#ffffff"} />
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
              {localCategories.map((category) => (
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
