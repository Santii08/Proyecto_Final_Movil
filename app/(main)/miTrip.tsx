import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

/* ---------------- TYPES ---------------- */
type Trip = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  seats_available: number;
  price: number;
  status: string | null;
  vehicle_plate?: string | null;
  vehicle_color?: string | null;
};

export default function MyTrips() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FECHAS ---------------- */
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  /* ---------------- FETCH VIAJES ---------------- */
  const fetchTrips = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("viajes")
      .select(
        `
        id,
        origin,
        destination,
        departure_time,
        seats_available,
        price,
        status,
        vehiculo:vehiculos(plate, color)
      `
      )
      .eq("driver_id", user.id)
      .order("departure_time", { ascending: false });

    if (error) {
      console.log("❌ Error trayendo viajes:", error.message);
      setLoading(false);
      return;
    }

    const mapped =
      data?.map((row: any) => ({
        id: row.id,
        origin: row.origin,
        destination: row.destination,
        departure_time: row.departure_time,
        seats_available: row.seats_available,
        price: row.price,
        status: row.status,
        vehicle_plate: row.vehiculo?.plate ?? null,
        vehicle_color: row.vehiculo?.color ?? null,
      })) ?? [];

    setTrips(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  /* ---------------- MAP UI STATUS ---------------- */
  const mapStatusLabel = (status: string | null) => {
    switch (status) {
      case "publicado":
      case "pendiente":
        return { text: "Pendiente", bg: "#FFF7ED", color: "#C2410C" };
      case "confirmado":
        return { text: "Confirmado", bg: "#ECFDF5", color: "#047857" };
      case "cancelado":
        return { text: "Cancelado", bg: "#FEF2F2", color: "#B91C1C" };
      case "finalizado":
        return { text: "Finalizado", bg: "#E0E7FF", color: "#1E3A8A" };
      default:
        return { text: "Pendiente", bg: "#EEE", color: "#333" };
    }
  };

  /* ---------------- ELIMINAR VIAJE ---------------- */
  const handleDeleteTrip = (trip: Trip) => {
    Alert.alert(
      "Eliminar viaje",
      "¿Seguro que quieres eliminar este viaje? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("viajes")
              .delete()
              .eq("id", trip.id);

            if (error) {
              console.log("❌ Error eliminando viaje:", error.message);
              Alert.alert("Error", "No se pudo eliminar el viaje.");
              return;
            }

            setTrips((prev) => prev.filter((t) => t.id !== trip.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F7FB" }}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <LinearGradient
          colors={["#2F6CF4", "#00C2FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          {/* Botón atrás */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mis viajes</Text>
            <Text style={styles.headerSubtitle}>
              Historial de todos tus trayectos
            </Text>
          </View>
        </LinearGradient>

        {/* TARJETA LISTA */}
        <View style={styles.card}>
          <Text style={styles.title}>Historial</Text>

          {loading ? (
            <Text style={{ color: "#6B7280" }}>Cargando...</Text>
          ) : trips.length === 0 ? (
            <Text style={{ color: "#6B7280" }}>No tienes viajes aún.</Text>
          ) : (
            trips.map((t) => {
              const ui = mapStatusLabel(t.status);

              return (
                <Pressable
                  key={t.id}
                  style={styles.trip}
                  onPress={() => handleDeleteTrip(t)}
                >
                  {/* Icono */}
                  <View
                    style={[
                      styles.tripIcon,
                      { backgroundColor: t.vehicle_color ?? "#EEF4FF" },
                    ]}
                  >
                    <Ionicons
                      name="car-sport-outline"
                      size={20}
                      color="#fff"
                    />
                  </View>

                  {/* Contenido */}
                  <View style={{ flex: 1 }}>
                    {/* Ruta + estado en la misma fila */}
                    <View style={styles.tripHeaderRow}>
                      <Text
                        style={styles.tripRoute}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t.origin} → {t.destination}
                      </Text>

                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: ui.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: ui.color },
                          ]}
                        >
                          {ui.text}
                        </Text>
                      </View>
                    </View>

                    {/* Fecha + hora */}
                    <View style={styles.metaRow}>
                      <Text style={styles.tripMeta}>
                        {formatDate(t.departure_time)}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {formatTime(t.departure_time)}
                      </Text>
                    </View>

                    {/* Precio */}
                    <Text style={styles.tripMeta}>
                      ${t.price.toLocaleString("es-CO")}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 30,
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    position: "absolute",
    top: 70,
    left: 20,
  },
  headerContent: {
    gap: 4,
    marginTop: 40,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#E6F7FF",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  trip: {
    flexDirection: "row",
    alignItems: "flex-start", // 👈 importante para que la pill quede arriba
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 14,
    gap: 10,
  },
  tripIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tripHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tripRoute: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
    flex: 1, // 👈 para que el texto no se meta debajo del pill
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  tripMeta: {
    color: "#6B7280",
    fontSize: 13,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },
});
