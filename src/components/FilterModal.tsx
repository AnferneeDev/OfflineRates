import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Checkbox } from "./Checkbox"; // Import our new Checkbox

// A type for the category prop, compatible with both screens
type DisplayCategory = {
  id: string;
  name: string;
  icon: string | null;
};

type FilterModalProps = {
  isVisible: boolean;
  onClose: () => void;
  categories: DisplayCategory[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  onClearAll: () => void;
};

export const FilterModal = ({ isVisible, onClose, categories, selectedCategories, onToggleCategory, onClearAll }: FilterModalProps) => (
  <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
    <View className="flex-1 bg-black/40 justify-end">
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <View className="bg-white max-h-[75%] rounded-t-[20px] overflow-hidden pt-2">
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-zinc-200">
          <Text className="text-lg font-semibold">Filter by Category</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-blue-500 font-semibold">Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView className="px-4 pb-4">
          {categories.map((category) => (
            <Checkbox key={category.id} label={category.name} icon={category.icon || "?"} value={selectedCategories.includes(category.id)} onToggle={() => onToggleCategory(category.id)} />
          ))}
        </ScrollView>
        {selectedCategories.length > 0 && (
          <TouchableOpacity className="h-11 justify-center items-center rounded-lg bg-zinc-100 mx-4 mb-4 mt-2" onPress={onClearAll}>
            <Text className="text-base font-medium text-blue-500">Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </Modal>
);
