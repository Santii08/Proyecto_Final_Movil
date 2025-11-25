import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CameraComponent from "../components/camera";
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";
import { uploadDriverAvatar } from "../utils/uploads";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string | null;
};

export default function DriverProfile() {
  const router = useRouter();

  // 👇 igual que en EditProfile: traemos updateProfile y user del contexto
  const { user, updateProfile } = useContext(AuthContext);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const fullName = `${(user as any)?.first_name ?? ""} ${
    (user as any)?.last_name ?? ""
  }`.trim();

  const [avatarUrl, setAvatarUrl] = useState<string>(
  (user as any)?.avatar_driver_url ?? "https://i.pravatar.cc/150"
  );

  const avatar =
  avatarUrl ||
  (user as any)?.avatar_driver_url ||
  "https://i.pravatar.cc/150";

  /* ================================
        TRAER DATOS DEL CONDUCTOR
  ================================= */
  const fetchVehicles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("driver_id", user.id);

      if (error) {
        console.log("❌ Error trayendo vehículos:", error.message);
        return;
      }

      setVehicles(data as Vehicle[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  // Si cambia el user en contexto (porque se actualiza el perfil),
  // reflejamos ese cambio en el estado local.
  useEffect(() => {
  if (user?.avatar_driver_url) {
    setAvatarUrl(user.avatar_driver_url);
  }
}, [user?.avatar_driver_url]);

  /* ================================
          CERRAR SESIÓN
  ================================= */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Si tu AuthContext tiene setUser, puedes llamar ahí. Si no, basta con que login redirija.
    router.replace("/(auth)/login");
  };

  /* ================================
        MANEJO DE FOTO DE PERFIL
  ================================= */

  const handleImageSelected = async (uri: string) => {
  if (!user) return;

  try {
    setUploading(true);

    // 1. subir a storage SOLO como driver
    const publicUrl = await uploadDriverAvatar(user.id, uri);
    console.log("✅ Avatar DRIVER subido:", publicUrl);

    // 2. actualizar perfil
    const success = await updateProfile({
      avatar_driver_url: publicUrl,
    });

    if (!success) {
      Alert.alert("Error", "No se pudo actualizar la foto de perfil.");
      return;
    }

    // 3. actualizar estado local
    setAvatarUrl(publicUrl);

    Alert.alert("Éxito", "Foto de perfil de conductor actualizada.");
  } catch (err) {
    console.error("❌ Error al actualizar avatar driver:", err);
    Alert.alert("Error", "No se pudo actualizar la foto de perfil.");
  } finally {
    setUploading(false);
    setShowCamera(false);
  }
};


  const openGallery = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Debes otorgar permiso a la galería para seleccionar una imagen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert("Foto de perfil", "¿Qué quieres hacer?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tomar foto",
        onPress: () => setShowCamera(true),
      },
      {
        text: "Elegir de galería",
        onPress: openGallery,
      },
    ]);
  };

  if (!user) return null;

  // Si la cámara está abierta, mostramos solo la cámara
  if (showCamera) {
    return (
      <CameraComponent
        onCapture={handleImageSelected}
        onCancel={() => setShowCamera(false)}
      />
    );
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      {/* HEADER */}
      <LinearGradient
        colors={["#2F6CF4", "#00C2FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Flecha atrás */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        {/* Botón Cerrar Sesión */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#fff" />
        </Pressable>

        <View style={styles.headerContent}>
          {/* 👉 Igual que en EditProfile: usamos avatarUrl del estado */}
          <Pressable onPress={handleAvatarPress}>
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </Pressable>

          {/* Nombre completo debajo de la imagen */}
          <Text style={styles.name}>{fullName || "Conductor UniRide"}</Text>
        </View>
      </LinearGradient>

      {/* CARD INFORMACIÓN */}
      <View style={styles.card}>
        {/* Email */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{user.email}</Text>
        </View>

        {/* Teléfono */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>
            {(user as any).phone || "Sin teléfono"}
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.row}>
          <Ionicons name="star" size={22} color="#FFD166" />
          <Text style={styles.label}>4.9 ⭐ (256 viajes)</Text>
        </View>

        {/* Vehículos */}
        <Text style={styles.sectionTitle}>Vehículos registrados</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 10 }} />
        ) : vehicles.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No tienes vehículos aún.</Text>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleRow}>
              <Ionicons name="car-sport-outline" size={22} color="#2F6CF4" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.vehicleText}>
                  {v.brand} {v.model} {v.year}
                </Text>
                <Text style={[styles.vehicleText, { color: "#374151" }]}>
                  Placa: {v.plate}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Button Editar Perfil */}
        <Pressable
          style={styles.button}
          onPress={() => router.push("/(main)/editDriverProfile")}
        >
          <LinearGradient
            colors={["#28A745", "#34D058"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Text style={styles.buttonText}>Editar perfil</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: 70,
    left: 20,
  },
  logoutBtn: {
    position: "absolute",
    top: 70,
    right: 20,
  },
  headerContent: { alignItems: "center", marginTop: 50 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 10,
  },
  avatarOverlay: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#E6F7FF", fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  label: { fontSize: 16, color: "#111827", fontWeight: "500" },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  vehicleText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },

  button: { marginTop: 18 },
  gradient: {
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
