import { Text, TouchableOpacity, View } from "react-native";

// This is the identical Checkbox component, now in its own file.
export const Checkbox = ({ label, icon, value, onToggle }: { label: string; icon: string; value: boolean; onToggle: () => void }) => (
  <TouchableOpacity className="flex-row items-center py-3.5 border-b border-zinc-200" onPress={onToggle}>
    <View className={`w-5 h-5 border-2 rounded-md mr-4 justify-center items-center ${value ? "bg-blue-500 border-blue-500" : "border-zinc-400"}`}>{value && <Text className="text-white text-xs font-bold">✓</Text>}</View>
    <Text className="text-base flex-1">
      {icon} {label}
    </Text>
  </TouchableOpacity>
);
