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
import { uploadPassengerAvatar } from "../utils/uploads";

export default function PassangerProfile() {
  const router = useRouter();
  const { user, setUser, updateProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);

  // 👇 Estados para foto (igual que en DriverProfile)
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(
    (user as any)?.avatar_passenger_url ?? "https://i.pravatar.cc/150"
  );

  const avatar =
    avatarUrl ||
    (user as any)?.avatar_passenger_url ||
    "https://i.pravatar.cc/150";


  /* ================================
        HIDRATAR USUARIO DESDE SUPABASE
  ================================== */
  useEffect(() => {
    const loadUserFromSession = async () => {
      try {
        console.log("👀 PassengerProfile montado. user en contexto:", user);

        if (user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("❌ Error en getUser:", error.message);
          setLoading(false);
          return;
        }

        if (!data.user) {
          console.log("⚠️ No hay sesión activa en Supabase");
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profileData) {
          console.error(
            "⚠️ No se encontró perfil en tabla usuarios:",
            profileError?.message
          );
          setLoading(false);
          return;
        }

        const finalUser = {
          id: profileData.id,
          email: profileData.email,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          phone: profileData.phone,
          plate: profileData.plate,
          rol: profileData.rol,
          avatar_url: profileData.avatar_url, // 👈 importante para foto
        };

        console.log("✅ Usuario reconstruido:", finalUser);
        setUser(finalUser);
        if (profileData.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }
      } catch (err: any) {
        console.error("❌ Error al hidratar usuario:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromSession();
  }, [user, setUser]);

  // Si cambia el user en contexto (perfil actualizado), reflejamos avatar
  useEffect(() => {
    if (user?.avatar_passenger_url) {
      setAvatarUrl(user.avatar_passenger_url);
    }
  }, [user?.avatar_passenger_url]);


  /* ================================
              CERRAR SESIÓN
  ================================== */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  /* ================================
            MANEJO DE FOTO
  ================================== */

  const handleImageSelected = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      // 1. subir a storage SOLO como passenger
      const publicUrl = await uploadPassengerAvatar(user.id, uri);
      console.log("✅ Avatar PASSENGER subido:", publicUrl);

      // 2. actualizar perfil
      const success = await updateProfile({
        avatar_passenger_url: publicUrl,
      });

      if (!success) {
        Alert.alert("Error", "No se pudo actualizar la foto de perfil.");
        return;
      }

      // 3. actualizar estado local
      setAvatarUrl(publicUrl);

      Alert.alert("Éxito", "Foto de perfil de pasajero actualizada.");
    } catch (err) {
      console.error("❌ Error al actualizar avatar passenger:", err);
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

  /* ================================
            ESTADOS DE CARGA
  ================================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F6CF4" />
        <Text style={{ marginTop: 10, color: "#4B5563" }}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  // Si después de hidratar sigue sin usuario → no hay sesión
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#111827" }}>No hay usuario en sesión.</Text>
      </View>
    );
  }

  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    "Pasajero UniRide";

  const subtitle =
    user.rol === "ambos" ? "Pasajero y conductor UniRide" : "Pasajero UniRide";

  // Si la cámara está abierta, mostramos solo la cámara (igual que Driver)
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
      <LinearGradient
        colors={["#2F6CF4", "#00C2FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* 🔙 BOTÓN DE VOLVER */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(main)/indexPassanger")}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        {/* Botón Cerrar Sesión (como en Driver) */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#fff" />
        </Pressable>

        <View style={styles.headerContent}>
          {/* Avatar con overlay de carga y Alert de opciones */}
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

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        {/* Rol */}
        <View style={styles.row}>
          <Ionicons name="person-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>Rol: {user.rol}</Text>
        </View>

        {/* Email */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{user.email}</Text>
        </View>

        {/* Teléfono */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>
            {user.phone || "Sin teléfono registrado"}
          </Text>
        </View>

        {/* Placa (si aplica) */}
        {user.plate ? (
          <View style={styles.row}>
            <Ionicons name="car-sport-outline" size={22} color="#2F6CF4" />
            <Text style={styles.label}>Placa: {user.plate}</Text>
          </View>
        ) : null}

        {/* Mock viajes */}
        <View style={styles.row}>
          <Ionicons name="map-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>32 viajes realizados</Text>
        </View>

        {/* Botón editar perfil */}
        <Pressable
          style={styles.button}
          onPress={() => router.push("/(main)/editPassengerProfile")}
        >
          <LinearGradient
            colors={["#2F6CF4", "#00C2FF"]}
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
  logoutBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },
  header: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerContent: { alignItems: "center", marginTop: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: 40,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  label: { fontSize: 16, color: "#111827", fontWeight: "500" },
  button: { marginTop: 10 },
  gradient: {
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
