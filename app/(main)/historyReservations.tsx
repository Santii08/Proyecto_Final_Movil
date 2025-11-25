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

/* ---------- TIPOS ---------- */
type HistoryItem = {
  reserva_id: string;
  trip_id: string;
  created_at: string;
  status: string;

  origin: string;
  destination: string;
  departure_time: string;
  price: number;
  driver_name: string;
};

/* ---------- HELPERS FECHA/HORA ---------- */
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function HistoryReservations() {
  const { user } = useContext(AuthContext);
  const [reservas, setReservas] = useState<HistoryItem[]>([]);
  const [filtered, setFiltered] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchHistory(user.id);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async (userId: string) => {
    setLoading(true);

    try {
      console.log("🔎 Cargando historial para pasajero:", userId);

      type RowFromDb = {
        id: string;
        trip_id: string;
        created_at: string;
        status: string;
        viaje: {
          id: string;
          origin: string;
          destination: string;
          departure_time: string;
          price: number;
          conductor: {
            first_name: string | null;
            last_name: string | null;
          } | null;
        } | null;
      };

      const { data, error } = await supabase
        .from("reservas")
        .select(
          `
          id,
          trip_id,
          created_at,
          status,
          viaje:viajes (
            id,
            origin,
            destination,
            departure_time,
            price,
            conductor:usuarios (
              first_name,
              last_name
            )
          )
        `
        )
        .eq("passenger_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error cargando reservas:", error.message);
        setReservas([]);
        setFiltered([]);
        return;
      }

      const rows = (data ?? []) as unknown as RowFromDb[];

      const mapped: HistoryItem[] = rows
        .filter((r) => r.viaje !== null)
        .map((r) => {
          const v = r.viaje!;
          const driverName =
            (v.conductor?.first_name || v.conductor?.last_name)
              ? `${v.conductor?.first_name ?? ""} ${
                  v.conductor?.last_name ?? ""
                }`.trim()
              : "Conductor UniRide";

          return {
            reserva_id: r.id,
            trip_id: r.trip_id,
            created_at: r.created_at,
            status: r.status,
            origin: v.origin,
            destination: v.destination,
            departure_time: v.departure_time,
            price: v.price,
            driver_name: driverName,
          };
        });

      console.log("✅ Historial total de reservas:", mapped.length);
      setReservas(mapped);
      setFiltered(mapped);
    } catch (e) {
      console.error("❌ Excepción cargando historial:", e);
      setReservas([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  /* 🔍 FILTRAR POR FECHA (YYYY, YYYY-MM, YYYY-MM-DD) SOBRE created_at */
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
          <Text style={{ color: "#6B7280", textAlign: "center" }}>
            No tienes viajes en tu historial todavía.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.reserva_id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.tripText}>
                {item.origin} → {item.destination}
              </Text>

              <Text style={styles.driver}>
                Conductor: {item.driver_name}
              </Text>

              <Text style={styles.time}>
                Salida: {formatDate(item.departure_time)} ·{" "}
                {formatTime(item.departure_time)}
              </Text>

              <Text style={styles.date}>
                Reservado el: {formatDate(item.created_at)}
              </Text>

              <Text style={styles.status}>
                Estado: <Text style={styles.statusBold}>{item.status}</Text>
              </Text>

              <Text style={styles.price}>
                Precio: ${item.price.toLocaleString("es-CO")} / pasajero
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- ESTILOS ---------- */
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
  date: { marginTop: 4, color: "#4B5563", fontSize: 13 },
  status: { marginTop: 4, color: "#4B5563", fontSize: 13 },
  statusBold: { fontWeight: "700" },
  price: { marginTop: 6, color: "#047857", fontWeight: "600" },
});
