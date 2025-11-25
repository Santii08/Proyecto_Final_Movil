import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

/* ---------- TIPOS ---------- */
type FilterType = "today" | "week" | "recent";

type ReservationWithTrip = {
  reserva_id: string;
  trip_id: string;
  created_at: string;
  reserva_status: string;

  origin: string;
  destination: string;
  departure_time: string;
  price: number;
  driver_name: string;
};

/* ---------- HELPERS FECHAS (mismo estilo que indexDriver) ---------- */
const startOfWeek = (d: Date) => {
  const tmp = new Date(d);
  const day = tmp.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // arrancar lunes
  tmp.setDate(tmp.getDate() + diff);
  tmp.setHours(0, 0, 0, 0);
  return tmp;
};

const endOfWeek = (d: Date) => {
  const start = startOfWeek(d);
  const tmp = new Date(start);
  tmp.setDate(start.getDate() + 6);
  tmp.setHours(23, 59, 59, 999);
  return tmp;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
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

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function MyReservations() {
  const { user } = useContext(AuthContext);
  const [reservas, setReservas] = useState<ReservationWithTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripFilter, setTripFilter] = useState<FilterType>("today");

  useEffect(() => {
    const load = async () => {
      if (!user) {
        console.log("⚠️ No hay usuario en contexto en MyReservations");
        return;
      }
      await fetchReservations(user.id);
    };

    load();
  }, [user]);

  const fetchReservations = async (userId: string) => {
    try {
      setLoading(true);
      console.log("🔎 Cargando reservas para pasajero:", userId);

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
        .eq("passenger_id", userId);

      if (error) {
        console.error("❌ Error cargando reservas:", error.message);
        setReservas([]);
        return;
      }

      const rows = (data ?? []) as unknown as RowFromDb[];

      const mapped: ReservationWithTrip[] = rows
        .filter((r) => r.viaje !== null) // descartar reservas a viajes borrados
        .map((r) => {
          const v = r.viaje!;
          const driverName =
            (v.conductor?.first_name || v.conductor?.last_name) ?
              `${v.conductor?.first_name ?? ""} ${
                v.conductor?.last_name ?? ""
              }`.trim() :
              "Conductor UniRide";

          return {
            reserva_id: r.id,
            trip_id: r.trip_id,
            created_at: r.created_at,
            reserva_status: r.status,
            origin: v.origin,
            destination: v.destination,
            departure_time: v.departure_time,
            price: v.price,
            driver_name: driverName,
          };
        });

      // Ordenamos por fecha de salida (más próximo primero)
      mapped.sort(
        (a, b) =>
          new Date(a.departure_time).getTime() -
          new Date(b.departure_time).getTime()
      );

      setReservas(mapped);
      console.log("✅ Reservas con viaje:", mapped.length);
    } catch (e) {
      console.error("❌ Excepción al cargar reservas:", e);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FILTRADO TIPO indexDriver (Hoy / Semana / Recientes) ---------- */
  const filtered = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Solo consideramos viajes futuros o de hoy
    let base = reservas.filter((r) => {
      const d = new Date(r.departure_time);
      return d >= new Date(now.setHours(0, 0, 0, 0)); // desde hoy en adelante
    });

    if (tripFilter === "today") {
      base = base.filter((r) => isSameDay(new Date(r.departure_time), now));
    } else if (tripFilter === "week") {
      base = base.filter((r) => {
        const d = new Date(r.departure_time);
        return d >= weekStart && d <= weekEnd;
      });
    } else {
      // recent: no filtro adicional, solo ordenados como arriba
    }

    return base;
  }, [reservas, tripFilter]);

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <LinearGradient colors={["#2F6CF4", "#00C2FF"]} style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.title}>Mis reservas</Text>

        {/* Filtros tipo chips (Hoy / Semana / Recientes) */}
        <View style={styles.filterRow}>
          {(["today", "week", "recent"] as FilterType[]).map((f) => {
            const label =
              f === "today" ? "Hoy" : f === "week" ? "Esta semana" : "Recientes";
            const active = tripFilter === f;
            return (
              <Pressable
                key={f}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
                onPress={() => setTripFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
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
          <Text style={{ color: "#6B7280" }}>
            No tienes reservas para este filtro.
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

              <Text style={styles.price}>
                Precio: ${item.price.toLocaleString("es-CO")} / pasajero
              </Text>

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

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ffffff22",
  },
  filterChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12,
    color: "#F9FAFB",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#1D4ED8",
  },
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
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tripText: { fontSize: 17, fontWeight: "700", color: "#111827" },
  driver: { marginTop: 6, color: "#1E3A8A", fontWeight: "600" },
  time: { color: "#6B7280", marginTop: 4 },
  price: { color: "#047857", marginTop: 4, fontWeight: "600" },
  date: { marginTop: 6, color: "#4B5563", fontSize: 13 },
});
