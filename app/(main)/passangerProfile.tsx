import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

export default function PassengerProfile() {
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // 🔥 Hidratar usuario si está en null, usando Supabase
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
        };

        console.log("✅ Usuario reconstruido:", finalUser);
        setUser(finalUser);
      } catch (err: any) {
        console.error("❌ Error al hidratar usuario:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromSession();
  }, [user, setUser]);

  // Estado de carga
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

        <View style={styles.headerContent}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=12" }}
            style={styles.avatar}
          />
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },
  header: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerContent: { alignItems: "center" },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: 40,
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
