import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

/* ---------- TYPES ---------- */
type Trip = {
  id: string; // uuid de la tabla viajes
  driver: string; // nombre del conductor
  origin: string;
  destination: string;
  time: string; // hora formateada
  price: number;
  rating: number; // por ahora mock
};

const PassengerHome: React.FC = () => {
  const [search, setSearch] = useState("");
  const { user, setUser } = useContext(AuthContext);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  /* -----------------------------------------
     🔄 Hidratar usuario si viene null 
  ------------------------------------------*/
  useEffect(() => {
    const loadUserFromSession = async () => {
      try {
        if (user) return;

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          console.log("⚠️ No hay sesión activa en Supabase (IndexPassenger)");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profileData) {
          console.warn(
            "⚠️ No se encontró fila en 'usuarios' desde IndexPassenger:",
            profileError?.message
          );

          const fallbackUser = {
            id: data.user.id,
            email: data.user.email ?? "",
            firstName: data.user.user_metadata?.first_name ?? "",
            lastName: data.user.user_metadata?.last_name ?? "",
            phone: data.user.user_metadata?.phone ?? "",
            plate: data.user.user_metadata?.plate ?? "",
            rol:
              (data.user.user_metadata?.rol as
                | "pasajero"
                | "conductor"
                | "ambos") ?? "pasajero",
          };

          setUser(fallbackUser);
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

        setUser(finalUser);
      } catch (err: any) {
        console.error(
          "❌ Error hidratando usuario en IndexPassenger:",
          err.message
        );
      }
    };

    loadUserFromSession();
  }, [user, setUser]);

  /* -----------------------------------------
     🔥 Cargar viajes reales desde Supabase
  ------------------------------------------*/
  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoadingTrips(true);

        // join con usuarios para sacar nombre del conductor
        const { data, error } = await supabase
          .from("viajes")
          .select(
            "id, origin, destination, departure_time, price, usuarios(first_name, last_name)"
          )
          .eq("status", "publicado");

        if (error) {
          console.error("❌ Error cargando viajes:", error.message);
          setTrips([]);
          return;
        }

        const safeData = (data ?? []) as any[];

        const mapped: Trip[] = safeData.map((v) => {
          const conductor =
            v.usuarios && v.usuarios.first_name
              ? `${v.usuarios.first_name} ${v.usuarios.last_name ?? ""}`.trim()
              : "Conductor";

          return {
            id: v.id, // uuid real
            driver: conductor,
            origin: v.origin,
            destination: v.destination,
            time: new Date(v.departure_time).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            price: v.price,
            rating: 4.9, // por ahora mock fijo
          };
        });

        setTrips(mapped);
      } catch (err) {
        console.error("❌ Excepción cargando viajes:", err);
        setTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    };

    loadTrips();
  }, []);

  /* -----------------------------------------
     FILTRO DE VIAJES
  ------------------------------------------*/
  const filteredTrips = trips.filter(
    (t) =>
      t.origin.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
  );

  const firstName = user?.firstName?.trim() || "UniRider";

  /* ------------------------------------------------
     🔥 FUNCIÓN PARA HACER RESERVA
  --------------------------------------------------*/
  const reservarViaje = async (trip: Trip) => {
    if (!user) {
      Alert.alert("Aviso", "Debes iniciar sesión para reservar.");
      return;
    }

    try {
      // Evitar reservas repetidas
      const { data: existing, error: existingError } = await supabase
        .from("reservas")
        .select("*")
        .eq("trip_id", trip.id) // ahora es uuid válido
        .eq("passenger_id", user.id) // uuid de usuarios
        .maybeSingle();

      if (existingError) {
        console.error(
          "❌ Error consultando reservas existentes:",
          existingError.message
        );
      }

      if (existing) {
        Alert.alert("Aviso", "Ya tienes una reserva para este viaje.");
        return;
      }

      // Crear la reserva
      const { error } = await supabase.from("reservas").insert({
        trip_id: trip.id,
        passenger_id: user.id,
      });

      if (error) {
        console.error("❌ Error reservando:", error.message);
        Alert.alert("Error", "No se pudo reservar el viaje.");
        return;
      }

      Alert.alert(
        "🎉 Reserva confirmada",
        `Te has unido al viaje de ${trip.driver}`
      );
    } catch (e) {
      console.error("❌ Excepción al reservar:", e);
      Alert.alert("Error", "Ocurrió un problema al reservar.");
    }
  };

  const handleProfilePress = () => {
    if (!user) {
      router.push("/(main)/passangerProfile");
      return;
    }

    if (user.rol === "conductor") {
      router.push("/(main)/driverProfile");
    } else {
      router.push("/(main)/passangerProfile");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={["#2F6CF4", "#00C2FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcome}>Hola, {firstName} 👋</Text>
              <Text style={styles.subtext}>¿A dónde quieres ir hoy?</Text>
            </View>
            <Ionicons
              name="person-circle-outline"
              size={40}
              color="#fff"
              onPress={handleProfilePress}
            />
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar destino o punto de partida"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </LinearGradient>

        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <ActionButton
            icon={<Ionicons name="time-outline" size={22} color="#2F6CF4" />}
            label="Historial"
            onPress={() => router.push("/(main)/historyReservations")}
          />

          <ActionButton
            icon={
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={22}
                color="#2F6CF4"
              />
            }
            label="Mis reservas"
            onPress={() => router.push("/(main)/myReservation")}
          />

          <ActionButton
            icon={<Ionicons name="headset-outline" size={22} color="#2F6CF4" />}
            label="Soporte"
            onPress={() => router.push("/(main)/support")}
          />
        </View>

        {/* Lista de viajes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Viajes disponibles</Text>

          {loadingTrips ? (
            <Text style={styles.noTrips}>Cargando viajes...</Text>
          ) : filteredTrips.length === 0 ? (
            <Text style={styles.noTrips}>No se encontraron viajes</Text>
          ) : (
            <FlatList
              data={filteredTrips}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.tripItem}>
                  <View style={styles.tripLeft}>
                    <Ionicons name="car-outline" size={22} color="#2F6CF4" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripRoute}>
                        {item.origin} → {item.destination}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {item.time} | ${item.price.toLocaleString("es-CO")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.driverName}>{item.driver}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFD166" />
                      <Text style={styles.ratingText}>
                        {item.rating.toFixed(1)}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.reserveBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/(main)/mapScreen",
                          params: {
                            trip_id: item.id,
                            destination_lat: item.destination_lat,
                            destination_lng: item.destination_lng,
                          },
                        })
                      }
                    >
                      <Text style={styles.reserveText}>Ver ruta</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PassengerHome;

/* ---------- COMPONENTE BOTÓN RÁPIDO ---------- */
type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
}) => (
  <Pressable onPress={onPress} style={styles.actionBtn}>
    <View style={styles.actionIcon}>{icon}</View>
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
);

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  welcome: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtext: { color: "#E6F7FF", fontSize: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    color: "#111827",
    fontSize: 15,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    marginHorizontal: 12,
  },
  actionBtn: { alignItems: "center", width: 90 },
  actionIcon: {
    backgroundColor: "#EEF4FF",
    borderRadius: 14,
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionLabel: { fontSize: 13, fontWeight: "700", color: "#1F2937" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 18,
    marginTop: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  noTrips: { textAlign: "center", color: "#6B7280", marginTop: 12 },

  tripItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 14,
  },
  tripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  tripRoute: { fontWeight: "700", color: "#111827" },
  tripMeta: { color: "#6B7280", fontSize: 13 },
  driverName: { fontWeight: "600", color: "#1E3A8A", fontSize: 14 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  ratingText: { marginLeft: 4, color: "#4B5563", fontSize: 12 },

  reserveBtn: {
    backgroundColor: "#2F6CF4",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  reserveText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
