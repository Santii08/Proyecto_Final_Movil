import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

type Reservation = {
  id: string;
  trip_id: string;
  created_at: string;
};

type Trip = {
  id: string;
  driver: string;
  origin: string;
  destination: string;
  time: string;
  price: number;
};

export default function MyReservations() {
  const { user } = useContext(AuthContext);
  const [reservas, setReservas] = useState<(Reservation & Partial<Trip>)[]>([]);
  const [filtered, setFiltered] = useState<(Reservation & Partial<Trip>)[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  // 🔥 Cargar reservas cuando haya usuario
  useEffect(() => {
    const load = async () => {
      if (!user) {
        console.log("⚠️ No hay usuario en contexto en MyReservations");
        setLoading(false);
        return;
      }
      await fetchReservations(user.id);
    };

    load();
  }, [user]);

  const fetchReservations = async (userId: string) => {
    setLoading(true);
    try {
      console.log("🔎 Cargando reservas para:", userId);

      // 1️⃣ Traer reservas del usuario
      const { data: reservasData, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("passenger_id", userId);

      if (error) {
        console.error("❌ Error cargando reservas:", error.message);
        setReservas([]);
        setFiltered([]);
        return;
      }

      const safeReservas = reservasData ?? [];

      // 2️⃣ Traer detalles del viaje (usando mockTrips por ahora)
      const detailed: (Reservation & Partial<Trip>)[] = safeReservas.map(
        (r: any) => {
          const trip = mockTrips.find((t) => t.id === r.trip_id);
          return { ...r, ...(trip || {}) };
        }
      );

      console.log("✅ Reservas encontradas:", detailed.length);
      setReservas(detailed);
      setFiltered(detailed);
    } catch (e) {
      console.error("❌ Excepción al cargar reservas:", e);
      setReservas([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  /* 🔍 FILTRAR POR FECHA (YYYY-MM-DD, o año, o año-mes) */
  useEffect(() => {
    if (!filterDate.trim()) {
      setFiltered(reservas);
      return;
    }

    const value = filterDate.trim();

    const isValid =
      /^[0-9]{4}$/.test(value) || // 2025
      /^[0-9]{4}-[0-9]{2}$/.test(value) || // 2025-11
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value); // 2025-11-20

    if (!isValid) {
      // Si está escribiendo algo raro, no filtra, muestra todo
      setFiltered(reservas);
      return;
    }

    setFiltered(reservas.filter((r) => r.created_at.startsWith(value)));
  }, [filterDate, reservas]);

  // 🧱 UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <LinearGradient colors={["#2F6CF4", "#00C2FF"]} style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.title}>Mis Reservas</Text>

        <View style={styles.searchBar}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Filtrar por fecha (YYYY, YYYY-MM o YYYY-MM-DD)"
            placeholderTextColor="#9CA3AF"
            value={filterDate}
            onChangeText={setFilterDate}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6CF4" />
          <Text style={{ marginTop: 10 }}>Cargando reservas...</Text>
        </View>
      ) : !user ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: "#6B7280" }}>
            Debes iniciar sesión para ver tus reservas.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: "#6B7280" }}>No tienes reservas.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.trip_id}-${item.created_at}`}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.tripText}>
                {item.origin} → {item.destination}
              </Text>
              <Text style={styles.driver}>Conductor: {item.driver}</Text>
              <Text style={styles.time}>Hora: {item.time}</Text>
              <Text style={styles.date}>
                Reservado el: {item.created_at.substring(0, 10)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- MOCK VIAJES ---------- */
const mockTrips: Trip[] = [
  {
    id: "1",
    driver: "Carlos Pérez",
    origin: "Universidad de La Sabana",
    destination: "Portal Norte",
    time: "13:45",
    price: 7000,
  },
  {
    id: "2",
    driver: "María López",
    origin: "Chía Centro",
    destination: "Calle 100",
    time: "14:10",
    price: 9000,
  },
  {
    id: "3",
    driver: "Andrés Gómez",
    origin: "La Caro",
    destination: "Unicentro",
    time: "15:00",
    price: 8500,
  },
];

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 15,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, marginLeft: 8, color: "#111" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    marginBottom: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tripText: { fontSize: 17, fontWeight: "700", color: "#111" },
  driver: { marginTop: 6, color: "#1E3A8A", fontWeight: "600" },
  time: { color: "#6B7280", marginTop: 4 },
  date: { marginTop: 6, color: "#4B5563", fontSize: 13 },
});
