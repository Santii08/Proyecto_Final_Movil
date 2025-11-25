// components/GalleryPicker.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ImagePickerExample({
  onSelect,
}: {
  onSelect?: (uri: string) => void;
}) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 👈 así es en expo-image-picker
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (onSelect) onSelect(uri); // notifica al padre
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Ionicons name="images-outline" size={22} color="#fff" />
        <Text style={styles.btnText}> Elegir desde galería</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DA1F2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
