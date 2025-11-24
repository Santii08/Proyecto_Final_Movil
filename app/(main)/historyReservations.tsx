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
  passenger_id: string;
};

type Trip = {
  id: string;
  driver: string;
  origin: string;
  destination: string;
  time: string;
  price: number;
};

export default function HistoryReservations() {
  const { user } = useContext(AuthContext);
  const [reservas, setReservas] = useState<(Reservation & Trip)[]>([]);
  const [filtered, setFiltered] = useState<(Reservation & Trip)[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: reservasData, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("passenger_id", user.id);

      if (error) {
        console.error("❌ Error cargando reservas:", error.message);
        setLoading(false);
        return;
      }

      if (!reservasData || reservasData.length === 0) {
        setReservas([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Enlazar con datos de viaje (mock)
      const detailed: (Reservation & Trip)[] = reservasData.map((r) => {
        const trip = mockTrips.find((t) => t.id === r.trip_id);
        return {
          ...r,
          ...(trip || {
            driver: "Conductor desconocido",
            origin: "Origen desconocido",
            destination: "Destino desconocido",
            time: "00:00",
            price: 0,
          }),
        };
      });

      // 3️⃣ Filtrar solo reservas con al menos 24h de antigüedad
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const pastReservations = detailed.filter((r) => {
        const createdMs = new Date(r.created_at).getTime();
        return now - createdMs >= oneDayMs;
      });

      console.log("✅ Historial (reservas pasadas):", pastReservations.length);

      setReservas(pastReservations);
      setFiltered(pastReservations);
    } catch (e) {
      console.error("❌ Excepción cargando historial:", e);
    } finally {
      setLoading(false);
    }
  };

  /* 🔍 FILTRAR POR FECHA (YYYY-MM-DD) DENTRO DEL HISTORIAL */
  useEffect(() => {
    if (!filterDate.trim()) {
      setFiltered(reservas);
      return;
    }

    const clean = filterDate.trim();

    const isValid =
      /^[0-9]{4}$/.test(clean) ||
      /^[0-9]{4}-[0-9]{2}$/.test(clean) ||
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(clean);

    if (!isValid) {
      setFiltered(reservas);
      return;
    }

    setFiltered(reservas.filter((r) => r.created_at.startsWith(clean)));
  }, [filterDate, reservas]);

  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "#111827" }}>
          Debes iniciar sesión para ver tu historial.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <LinearGradient colors={["#2F6CF4", "#00C2FF"]} style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Historial</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Filtrar por fecha (YYYY-MM-DD)"
            placeholderTextColor="#9CA3AF"
            value={filterDate}
            onChangeText={setFilterDate}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6CF4" />
          <Text style={{ marginTop: 10, color: "#4B5563" }}>
            Cargando historial...
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: "#6B7280" }}>
            No tienes viajes en tu historial todavía.
          </Text>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
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
