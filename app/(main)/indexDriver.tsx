import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { ReactNode, useCallback, useContext, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

/* ------- TYPES PARA VIAJES DE BD -------- */
type Trip = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  seats_available: number;
  price: number;
  status: string | null;
  vehicle_id: string | null;
  vehicle_plate?: string | null;
  vehicle_color?: string | null;

  // NUEVO
  seats_total: number;
  confirmed_passengers?: number;
  seats_left?: number;
};

type FilterType = "today" | "week" | "recent";

export default function DriverDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState(true);

  const { user, setUser } = useContext(AuthContext);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // 🔹 filtros de próximos viajes
  const [tripFilter, setTripFilter] = useState<FilterType>("today");

  // 🔹 ganancias reales
  const [earningsWeek, setEarningsWeek] = useState(0);

  // 🔹 meta semanal editable
  const [weeklyGoal, setWeeklyGoal] = useState(300_000);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(weeklyGoal));

  // 🔹 modal de detalles de viaje
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const weeklyProgress = Math.min(
    weeklyGoal > 0 ? earningsWeek / weeklyGoal : 0,
    1
  );

  const firstName =
    (user as any)?.first_name ??
    (user as any)?.firstName ??
    "Conductor UniRide";

  /* --------- Helpers de fechas ---------- */
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

  /* --------- Cargar perfil desde tabla usuarios ---------- */
  const fetchUserProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error fetching profile:", error.message);
    } else if (data) {
      setUser(data);
    }
  };

  /* --------- Cargar viajes del conductor ---------- */
  const fetchTrips = async () => {
    if (!user?.id) return;

    setLoadingTrips(true);
    try {
      type TripRowFromDb = {
        id: string;
        origin: string;
        destination: string;
        departure_time: string;
        seats_available: number;
        seats_total: number;
        price: number;
        status: string | null;
        vehicle_id: string | null;
        vehiculo: { plate: string; color: string | null } | null;
      };

      const { data, error } = await supabase
        .from("viajes")
        .select(
          `
          id,
          origin,
          destination,
          departure_time,
          seats_available,
          seats_total,
          price,
          status,
          vehicle_id,
          vehiculo:vehiculos (
            plate,
            color
          )
        `
        )
        .eq("driver_id", user.id);

      if (error) {
        console.log("❌ Error cargando viajes:", error.message);
        return;
      }

      const typedData = (data ?? []) as unknown as TripRowFromDb[];

      // 👇 NUEVO: contar reservas confirmadas (punto de recogida ya confirmado)
      const tripIds = typedData.map((row) => row.id);
      let confirmedByTrip: Record<string, number> = {};

      if (tripIds.length > 0) {
        type ReservaCountRow = { trip_id: string };

        const { data: reservasData, error: reservasError } = await supabase
          .from("reservas")
          .select("trip_id")
          .in("trip_id", tripIds)
          .eq("status", "confirmada");

        if (reservasError) {
          console.log("❌ Error cargando reservas:", reservasError.message);
        } else if (reservasData) {
          (reservasData as ReservaCountRow[]).forEach((r) => {
            confirmedByTrip[r.trip_id] = (confirmedByTrip[r.trip_id] ?? 0) + 1;
          });
        }
      }

      const mappedTrips: Trip[] = typedData.map((row) => {
        const veh = row.vehiculo;
        const confirmed = confirmedByTrip[row.id] ?? 0;
        const seatsLeft = Math.max(row.seats_total - confirmed, 0);

        return {
          id: row.id,
          origin: row.origin,
          destination: row.destination,
          departure_time: row.departure_time,
          seats_available: row.seats_available,
          seats_total: row.seats_total,
          price: row.price,
          status: row.status,
          vehicle_id: row.vehicle_id,
          vehicle_plate: veh?.plate ?? null,
          vehicle_color: veh?.color ?? null,
          confirmed_passengers: confirmed,
          seats_left: seatsLeft,
        };
      });

      setTrips(mappedTrips);
    } catch (e: any) {
      console.log("❌ Excepción al cargar viajes:", e.message);
    } finally {
      setLoadingTrips(false);
    }
  };

  /* --------- Cargar ganancias reales de la semana ---------- */
  const fetchWeeklyEarnings = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const weekStart = startOfWeek(now).toISOString();
      const weekEnd = endOfWeek(now).toISOString();

      type GananciaRow = {
        trip_id: string;
        amount: number;
        created_at: string;
      };

      const { data, error } = await supabase
        .from("ganancias")
        .select("trip_id, amount, created_at")
        .eq("driver_id", user.id)
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd);

      if (error) {
        console.log("❌ Error cargando ganancias:", error.message);
        return;
      }

      const rows = (data ?? []) as GananciaRow[];
      const total = rows.reduce((acc, row) => acc + (row.amount ?? 0), 0);
      setEarningsWeek(total);
    } catch (e: any) {
      console.log("❌ Excepción calculando ganancias:", e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchTrips();
      fetchWeeklyEarnings();
    }, [user?.id])
  );

  /* --------- Estado a texto ---------- */
  const mapStatusLabel = (
    dbStatus: string | null
  ): "Pendiente" | "Confirmado" | "Cancelado" | "Finalizado" | string => {
    switch (dbStatus) {
      case "publicado":
      case "pendiente":
        return "Pendiente";
      case "confirmado":
        return "Confirmado";
      case "cancelado":
        return "Cancelado";
      case "finalizado":
        return "Finalizado";
      default:
        return "Pendiente";
    }
  };

  /* --------- Filtrado + orden de viajes ---------- */
  const computeTripsForUI = () => {
    const today = new Date();
    const startWeek = startOfWeek(today);
    const endWeek = endOfWeek(today);

    let filtered = trips.filter((t) => {
      const d = new Date(t.departure_time);

      if (tripFilter === "today") {
        return isSameDay(d, today) && d >= today;
      }
      if (tripFilter === "week") {
        return d >= startWeek && d <= endWeek;
      }
      // 'recent': no filtro, solo orden
      return true;
    });

    filtered = filtered.sort((a, b) => {
      const da = new Date(a.departure_time).getTime();
      const db = new Date(b.departure_time).getTime();

      if (tripFilter === "recent") {
        // más recientes primero
        return db - da;
      }
      // por defecto, de más próximos hacia adelante
      return da - db;
    });

    return filtered;
  };

  const filteredTrips = computeTripsForUI();

  /* --------- Cancelar viaje ---------- */
  const handleCancelTrip = async (trip: Trip) => {
    const uiStatus = mapStatusLabel(trip.status);

    if (uiStatus === "Cancelado") {
      Alert.alert("Viaje ya cancelado", "Este viaje ya fue cancelado.");
      return;
    }

    const now = new Date();
    const departure = new Date(trip.departure_time);
    const diffMs = departure.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 40) {
      Alert.alert(
        "No puedes cancelar",
        "Solo puedes cancelar un viaje hasta 40 minutos antes de la hora de salida."
      );
      return;
    }

    Alert.alert(
      "Cancelar viaje",
      "¿Estás seguro de que deseas cancelar este viaje?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("viajes")
                .update({ status: "cancelado" })
                .eq("id", trip.id);

              if (error) {
                console.log("❌ Error al cancelar viaje:", error.message);
                Alert.alert("Error", "No se pudo cancelar el viaje.");
                return;
              }

              setTrips((prev) =>
                prev.map((t) =>
                  t.id === trip.id ? { ...t, status: "cancelado" } : t
                )
              );

              Alert.alert("Viaje cancelado", "Tu viaje ha sido cancelado.");
            } catch (e: any) {
              console.log("❌ Excepción al cancelar viaje:", e.message);
              Alert.alert("Error", "Ocurrió un problema al cancelar el viaje.");
            }
          },
        },
      ]
    );
  };

  /* --------- Finalizar viaje + guardar ganancias ---------- */
  const handleFinishTrip = async (trip: Trip) => {
    const uiStatus = mapStatusLabel(trip.status);

    if (uiStatus === "Cancelado") {
      Alert.alert("No disponible", "No puedes finalizar un viaje cancelado.");
      return;
    }
    if (uiStatus === "Finalizado") {
      Alert.alert(
        "Viaje ya finalizado",
        "Este viaje ya fue marcado como finalizado."
      );
      return;
    }

    Alert.alert(
      "Finalizar viaje",
      "¿Marcar este viaje como finalizado y registrar las ganancias?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, finalizar",
          onPress: async () => {
            try {
              // 1) verificar si ya hay registro de ganancias para este viaje
              const { data: existing, error: gainError } = await supabase
                .from("ganancias")
                .select("id, amount")
                .eq("trip_id", trip.id)
                .maybeSingle();

              if (gainError) {
                console.log(
                  "❌ Error comprobando ganancias existentes:",
                  gainError.message
                );
              }

              if (existing) {
                // Ya hay registro, solo marcar como finalizado
                const { error: updError } = await supabase
                  .from("viajes")
                  .update({ status: "finalizado" })
                  .eq("id", trip.id);

                if (updError) {
                  console.log("❌ Error al finalizar viaje:", updError.message);
                  Alert.alert("Error", "No se pudo finalizar el viaje.");
                  return;
                }

                setTrips((prev) =>
                  prev.map((t) =>
                    t.id === trip.id ? { ...t, status: "finalizado" } : t
                  )
                );

                fetchWeeklyEarnings();
                setTripModalVisible(false);
                Alert.alert(
                  "Viaje finalizado",
                  "Ya existía un registro de ganancias para este viaje."
                );
                return;
              }

              // 2) contar reservas del viaje
              type ReservaRow = { trip_id: string };

              const { data: reservasData, error: reservasError } =
                await supabase
                  .from("reservas")
                  .select("trip_id")
                  .eq("trip_id", trip.id);

              if (reservasError) {
                console.log(
                  "❌ Error cargando reservas:",
                  reservasError.message
                );
                Alert.alert(
                  "Error",
                  "No se pudo obtener la información de reservas."
                );
                return;
              }

              const reservas = (reservasData ?? []) as ReservaRow[];
              const cantidadPasajeros = reservas.length;

              const amount = trip.price * cantidadPasajeros;

              // 3) actualizar viaje a finalizado
              const { error: updError2 } = await supabase
                .from("viajes")
                .update({ status: "finalizado" })
                .eq("id", trip.id);

              if (updError2) {
                console.log("❌ Error al actualizar viaje:", updError2.message);
                Alert.alert("Error", "No se pudo finalizar el viaje.");
                return;
              }

              // 4) insertar ganancias
              const { error: insertError } = await supabase
                .from("ganancias")
                .insert({
                  trip_id: trip.id,
                  driver_id: user?.id,
                  amount,
                });

              if (insertError) {
                console.log(
                  "❌ Error insertando ganancias:",
                  insertError.message
                );
                Alert.alert(
                  "Error",
                  "El viaje se finalizó, pero no se pudo registrar las ganancias."
                );
              }

              setTrips((prev) =>
                prev.map((t) =>
                  t.id === trip.id ? { ...t, status: "finalizado" } : t
                )
              );

              fetchWeeklyEarnings();
              setTripModalVisible(false);

              Alert.alert(
                "Viaje finalizado",
                `Se registraron $${amount.toLocaleString(
                  "es-CO"
                )} de ganancias para este viaje.`
              );
            } catch (e: any) {
              console.log("❌ Excepción al finalizar viaje:", e.message);
              Alert.alert(
                "Error",
                "Ocurrió un problema al finalizar el viaje."
              );
            }
          },
        },
      ]
    );
  };

  /* --------- Guardar nueva meta semanal ---------- */
  const handleSaveGoal = () => {
    const n = parseInt(goalDraft, 10);
    if (isNaN(n) || n <= 0) {
      Alert.alert("Meta inválida", "Ingresa un valor numérico mayor que cero.");
      return;
    }
    setWeeklyGoal(n);
    setGoalModalVisible(false);
  };

  const openTripDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setTripModalVisible(true);
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
          style={[styles.header, { paddingTop: 18 + insets.top }]}
        >
          {/* burbujas */}
          <LinearGradient
            colors={["#ffffff66", "#ffffff10"]}
            style={[
              styles.bubble,
              {
                top: -30,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: 80,
              },
            ]}
          />
          <LinearGradient
            colors={["#ffffff55", "#ffffff10"]}
            style={[
              styles.bubble,
              {
                bottom: -20,
                left: -20,
                width: 120,
                height: 120,
                borderRadius: 60,
              },
            ]}
          />

          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={24}
                color="#2F6CF4"
                onPress={() => router.push("/(main)/driverProfile")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>Hola, {firstName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD166" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusText}>
                {available ? "Disponible" : "No disponible"}
              </Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                thumbColor={available ? "#fff" : "#fff"}
                trackColor={{ false: "#BFC8FF", true: "#34D399" }}
              />
            </View>
          </View>

          {/* Meta rápida / resumen */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Esta semana</Text>
              <Text style={styles.summaryValue}>
                ${earningsWeek.toLocaleString("es-CO")}
              </Text>
            </View>

            {/* 👉 Tocar aquí para cambiar meta */}
            <Pressable
              style={[styles.summaryItem, { alignItems: "flex-end" }]}
              onPress={() => {
                setGoalDraft(String(weeklyGoal));
                setGoalModalVisible(true);
              }}
            >
              <Text style={styles.summaryLabel}>Meta semanal</Text>
              <Text style={styles.summaryValue}>
                ${weeklyGoal.toLocaleString("es-CO")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${weeklyProgress * 100}%` },
              ]}
            />
          </View>
        </LinearGradient>

        {/* TARJETA ACCIONES RÁPIDAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionBtn
              icon={
                <Ionicons name="add-circle-outline" size={22} color="#2F6CF4" />
              }
              label="Publicar viaje"
              onPress={() => router.push("/(main)/createTrip")}
            />
            <ActionBtn
              icon={
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={22}
                  color="#2F6CF4"
                />
              }
              label="Mis viajes"
              onPress={() => router.push("/(main)/miTrip")}
            />
            <ActionBtn
              icon={
                <MaterialCommunityIcons
                  name="car-cog"
                  size={22}
                  color="#2F6CF4"
                />
              }
              label="Vehículo"
              onPress={() => router.push("/(main)/vehicleManager")}
            />
            {/* 🔹 Tu botón extra: puntos de recogida */}
            <ActionBtn
              icon={<Ionicons name="map-outline" size={22} color="#2F6CF4" />}
              label="Puntos recogida"
              onPress={() => router.push("/(main)/driverPickupMap")}
            />
            <ActionBtn
              icon={
                <Ionicons name="headset-outline" size={22} color="#2F6CF4" />
              }
              label="Soporte"
              onPress={() => router.push("/(main)/support")}
            />
          </View>
        </View>

        {/* PRÓXIMOS VIAJES */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Próximos viajes</Text>
            {/* Ver todos = poner filtro en "Recientes" */}
            <Pressable onPress={() => setTripFilter("recent")}>
              <Text style={styles.link}>Ver todos</Text>
            </Pressable>
          </View>

          {/* 🔹 Filtros por fecha (Hoy / Semana / Recientes) */}
          <View style={styles.filterRow}>
            {(["today", "week", "recent"] as FilterType[]).map((f) => {
              const label =
                f === "today"
                  ? "Hoy"
                  : f === "week"
                  ? "Esta semana"
                  : "Recientes";
              const active = tripFilter === f;
              return (
                <Pressable
                  key={f}
                  style={[styles.filterChip, active && styles.filterChipActive]}
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

          {loadingTrips ? (
            <Text style={{ color: "#6B7280", marginTop: 8 }}>
              Cargando viajes...
            </Text>
          ) : filteredTrips.length === 0 ? (
            <Text style={{ color: "#6B7280", marginTop: 8 }}>
              No hay viajes para este filtro.
            </Text>
          ) : (
            filteredTrips.map((item) => {
              const uiStatus = mapStatusLabel(item.status);

              return (
                <Pressable
                  key={item.id}
                  style={styles.tripRow}
                  onPress={() => openTripDetails(item)}
                >
                  <View style={styles.tripIcon}>
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color="#2F6CF4"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    {/* Fila superior: ruta + acciones (QR + pill) */}
                    <View style={styles.tripHeaderRow}>
                      <Text style={styles.tripRoute}>
                        {item.origin} → {item.destination}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {/* Botón QR */}
                        <Pressable
                          style={styles.qrBtn}
                          onPress={(e) => {
                            e.stopPropagation(); // evita abrir modal
                            router.push({
                              pathname: "/(main)/endTripQR",
                              params: { trip_id: item.id },
                            });
                          }}
                        >
                          <Ionicons
                            name="qr-code-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.qrBtnText}>QR</Text>
                        </Pressable>

                        <StatusPill
                          status={uiStatus}
                          onPress={() => handleCancelTrip(item)}
                        />
                      </View>
                    </View>

                    {/* Fila inferior: info fecha / hora / cupos / placa / precio */}
                    <View style={styles.tripMeta}>
                      <Badge
                        icon="calendar-outline"
                        text={formatDate(item.departure_time)}
                      />
                      <Badge
                        icon="time-outline"
                        text={formatTime(item.departure_time)}
                      />
                      <Badge
                        icon="people-outline"
                        text={
                          item.confirmed_passengers &&
                          item.confirmed_passengers > 0
                            ? `Llevas ${item.confirmed_passengers}, quedan ${item.seats_left}`
                            : `${item.seats_available} cupos`
                        }
                      />
                      <Badge
                        icon="car-sport-outline"
                        text={item.vehicle_plate ?? "Sin placa"}
                      />
                      <Badge
                        icon="cash-outline"
                        text={`$${item.price.toLocaleString("es-CO")}`}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* CTA STICKY */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <Pressable
        style={styles.fabWrap}
        onPress={() => router.push("/(main)/createTrip")}
      >
        <LinearGradient
          colors={["#2F6CF4", "#00C2FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Publicar viaje</Text>
        </LinearGradient>
      </Pressable>

      {/* 🔹 Modal para editar meta semanal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar meta semanal</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa el valor de tu nueva meta en COP.
            </Text>

            <TextInput
              value={goalDraft}
              onChangeText={setGoalDraft}
              keyboardType="numeric"
              style={styles.modalInput}
              placeholder="Meta semanal"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔹 Modal detalles de viaje + finalizar */}
      <Modal
        visible={tripModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTripModalVisible(false)}
      >
        <View style={styles.tripModalBackdrop}>
          <View style={styles.tripModalCard}>
            {selectedTrip && (
              <>
                <Text style={styles.tripModalTitle}>Detalle del viaje</Text>
                <Text style={styles.tripModalRoute}>
                  {selectedTrip.origin} → {selectedTrip.destination}
                </Text>

                <View style={styles.tripModalRow}>
                  <Badge
                    icon="calendar-outline"
                    text={formatDate(selectedTrip.departure_time)}
                  />
                  <Badge
                    icon="time-outline"
                    text={formatTime(selectedTrip.departure_time)}
                  />
                </View>

                <View style={styles.tripModalRow}>
                  <Badge
                    icon="people-outline"
                    text={
                      selectedTrip.confirmed_passengers &&
                      selectedTrip.confirmed_passengers > 0
                        ? `Llevas ${selectedTrip.confirmed_passengers}, quedan ${selectedTrip.seats_left}`
                        : `${selectedTrip.seats_available} cupos disponibles`
                    }
                  />
                  <Badge
                    icon="car-sport-outline"
                    text={selectedTrip.vehicle_plate ?? "Sin placa"}
                  />
                </View>

                <View style={styles.tripModalRow}>
                  <Badge
                    icon="cash-outline"
                    text={`$${selectedTrip.price.toLocaleString(
                      "es-CO"
                    )} / pasajero`}
                  />
                  <StatusPill status={mapStatusLabel(selectedTrip.status)} />
                </View>

                <View style={styles.tripModalActions}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnSecondary]}
                    onPress={() => setTripModalVisible(false)}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Cerrar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={() => handleFinishTrip(selectedTrip)}
                  >
                    <Text style={styles.modalBtnPrimaryText}>
                      Finalizar viaje
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- COMPONENTES AUXILIARES ---------- */
type ActionBtnProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function ActionBtn({ icon, label, onPress }: ActionBtnProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

type BadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function Badge({ icon, text }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={14} color="#4B5563" />
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

type StatusPillProps = {
  status: "Pendiente" | "Confirmado" | "Cancelado" | "Finalizado" | string;
  onPress?: () => void;
};

function StatusPill({ status, onPress }: StatusPillProps) {
  const map = {
    Pendiente: { bg: "#FFF7ED", color: "#C2410C" },
    Confirmado: { bg: "#ECFDF5", color: "#047857" },
    Cancelado: { bg: "#FEF2F2", color: "#B91C1C" },
    Finalizado: { bg: "#EFF6FF", color: "#1D4ED8" },
  } as const;
  const s = map[status as keyof typeof map] || {
    bg: "#EEF2FF",
    color: "#3730A3",
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, { backgroundColor: s.bg }]}
      hitSlop={8}
    >
      <Text style={[styles.pillText, { color: s.color }]}>{status}</Text>
    </Pressable>
  );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    opacity: 0.9,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 3,
  },
  welcome: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    color: "#E6F7FF",
    fontSize: 13,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff22",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { color: "#fff", fontWeight: "700", marginRight: 6 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  summaryItem: {},
  summaryLabel: { color: "#E6F7FF", fontSize: 12 },
  summaryValue: { color: "#fff", fontSize: 18, fontWeight: "800" },

  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#ffffff33",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34D399",
  },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  /* Actions */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 14,
  },
  link: { color: "#2F6CF4", fontWeight: "700" },

  /* Trips */
  tripRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tripIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  tripHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tripRoute: {
    color: "#111827",
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  tripMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: { color: "#4B5563", fontSize: 12 },

  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { fontWeight: "800", fontSize: 12 },

  /* Filtros */
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#1D4ED8",
  },

  /* FAB */
  fabWrap: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  fab: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  /* Modal meta semanal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBtnSecondary: {
    backgroundColor: "#F3F4F6",
  },
  modalBtnPrimary: {
    backgroundColor: "#2563EB",
  },
  modalBtnSecondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
  modalBtnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* Modal detalles viaje */
  tripModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  tripModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
  },
  tripModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  tripModalRoute: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  tripModalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tripModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },

  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#2F6CF4",
  },
  qrBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
});
