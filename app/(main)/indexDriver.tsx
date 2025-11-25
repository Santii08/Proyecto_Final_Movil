import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { ReactNode, useCallback, useContext, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

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
};

export default function DriverDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState(true);

  const { user, setUser } = useContext(AuthContext);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const firstName =
    (user as any)?.first_name ??
    (user as any)?.firstName ??
    'Conductor UniRide';

  // Mock ingresos (si luego quieres lo calculamos de viajes)
  const earningsToday = 82000;
  const weeklyGoal = 300000;
  const weeklyProgress = Math.min(earningsToday / weeklyGoal, 1);

  /* --------- Cargar perfil desde tabla usuarios ---------- */
  const fetchUserProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log('Error fetching profile:', error.message);
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
        price: number;
        status: string | null;
        vehicle_id: string | null;
        // 👇 OJO: objeto, NO array
        vehiculo: { plate: string; color: string | null } | null;
      };

      const { data, error } = await supabase
        .from('viajes')
        .select(`
          id,
          origin,
          destination,
          departure_time,
          seats_available,
          price,
          status,
          vehicle_id,
          vehiculo:vehiculos (
            plate,
            color
          )
        `)
        .eq('driver_id', user.id)
        .order('departure_time', { ascending: true });

      if (error) {
        console.log('❌ Error cargando viajes:', error.message);
        return;
      }

      const typedData = (data ?? []) as unknown as TripRowFromDb[];

      const mappedTrips: Trip[] = typedData.map((row) => {
        const veh = row.vehiculo; // 👈 ya es objeto o null

        return {
          id: row.id,
          origin: row.origin,
          destination: row.destination,
          departure_time: row.departure_time,
          seats_available: row.seats_available,
          price: row.price,
          status: row.status,
          vehicle_id: row.vehicle_id,
          vehicle_plate: veh?.plate ?? null,
          vehicle_color: veh?.color ?? null,
        };
      });

      setTrips(mappedTrips);
    } catch (e: any) {
      console.log('❌ Excepción al cargar viajes:', e.message);
    } finally {
      setLoadingTrips(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchTrips();
    }, [user?.id])
  );

  /* --------- Helpers ---------- */
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const mapStatusLabel = (
    dbStatus: string | null
  ): 'Pendiente' | 'Confirmado' | 'Cancelado' | string => {
    switch (dbStatus) {
      case 'publicado':
      case 'pendiente':
        return 'Pendiente';
      case 'confirmado':
        return 'Confirmado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  };

  // Lógica para cancelar viaje con validación de 40 minutos
  const handleCancelTrip = async (trip: Trip) => {
    const uiStatus = mapStatusLabel(trip.status);

    if (uiStatus === 'Cancelado') {
      Alert.alert('Viaje ya cancelado', 'Este viaje ya fue cancelado.');
      return;
    }

    const now = new Date();
    const departure = new Date(trip.departure_time);
    const diffMs = departure.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 40) {
      Alert.alert(
        'No puedes cancelar',
        'Solo puedes cancelar un viaje hasta 40 minutos antes de la hora de salida.'
      );
      return;
    }

    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro de que deseas cancelar este viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('viajes')
                .update({ status: 'cancelado' })
                .eq('id', trip.id);

              if (error) {
                console.log('❌ Error al cancelar viaje:', error.message);
                Alert.alert('Error', 'No se pudo cancelar el viaje.');
                return;
              }

              setTrips((prev) =>
                prev.map((t) =>
                  t.id === trip.id ? { ...t, status: 'cancelado' } : t
                )
              );

              Alert.alert('Viaje cancelado', 'Tu viaje ha sido cancelado.');
            } catch (e: any) {
              console.log('❌ Excepción al cancelar viaje:', e.message);
              Alert.alert('Error', 'Ocurrió un problema al cancelar el viaje.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F5F7FB' }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <LinearGradient
          colors={["#2F6CF4", "#00C2FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.header,
            { paddingTop: 18 + insets.top },
          ]}
        >
          {/* burbujas */}
          <LinearGradient
            colors={['#ffffff66', '#ffffff10']}
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
            colors={['#ffffff55', '#ffffff10']}
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
                onPress={() => router.push('/(main)/driverProfile')}
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
                {available ? 'Disponible' : 'No disponible'}
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
              <Text style={styles.summaryLabel}>Hoy</Text>
              <Text style={styles.summaryValue}>
                ${earningsToday.toLocaleString('es-CO')}
              </Text>
            </View>
            <View style={[styles.summaryItem, { alignItems: "flex-end" }]}>
              <Text style={styles.summaryLabel}>Meta semanal</Text>
              <Text style={styles.summaryValue}>
                ${weeklyGoal.toLocaleString('es-CO')}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${weeklyProgress * 100}%` }]}
            />
          </View>
        </LinearGradient>

        {/* TARJETA ACCIONES RÁPIDAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionBtn
              icon={
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color="#2F6CF4"
                />
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
            {/* 🔹 Nuevo botón: puntos de recogida */}
            <ActionBtn
              icon={<Ionicons name="map-outline" size={22} color="#2F6CF4" />}
              label="Puntos recogida"
              onPress={() => router.push("/(main)/driverPickupMap")}
            />
            <ActionBtn
              icon={
                <Ionicons
                  name="headset-outline"
                  size={22}
                  color="#2F6CF4"
                />
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
            <Pressable onPress={() => router.push("/(main)/indexDriver")}>
              <Text style={styles.link}>Ver todos</Text>
            </Pressable>
          </View>

          {loadingTrips ? (
            <Text style={{ color: '#6B7280', marginTop: 8 }}>
              Cargando viajes...
            </Text>
          ) : trips.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 8 }}>
              Aún no has publicado viajes.
            </Text>
          ) : (
            trips.map((item) => {
              const uiStatus = mapStatusLabel(item.status);

              return (
                <View key={item.id} style={styles.tripRow}>
                  <View style={styles.tripIcon}>
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color="#2F6CF4"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    {/* Fila superior: ruta + pill */}
                    <View style={styles.tripHeaderRow}>
                      <Text style={styles.tripRoute}>
                        {item.origin} → {item.destination}
                      </Text>
                      <StatusPill
                        status={uiStatus}
                        onPress={() => handleCancelTrip(item)}
                      />
                    </View>

                    {/* Fila inferior: info hora / cupos / placa / precio */}
                    <View style={styles.tripMeta}>
                      <Badge
                        icon="time-outline"
                        text={formatTime(item.departure_time)}
                      />
                      <Badge
                        icon="people-outline"
                        text={`${item.seats_available} cupos`}
                      />
                      <Badge
                        icon="car-sport-outline"
                        text={item.vehicle_plate ?? 'Sin placa'}
                      />
                      <Badge
                        icon="cash-outline"
                        text={`$${item.price.toLocaleString('es-CO')}`}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* CTA STICKY */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <Pressable
        style={styles.fabWrap}
        onPress={() => router.push('/(main)/createTrip')}
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
  status: 'Pendiente' | 'Confirmado' | 'Cancelado' | string;
  onPress?: () => void;
};

function StatusPill({ status, onPress }: StatusPillProps) {
  const map = {
    Pendiente: { bg: "#FFF7ED", color: "#C2410C" },
    Confirmado: { bg: "#ECFDF5", color: "#047857" },
    Cancelado: { bg: "#FEF2F2", color: "#B91C1C" },
  } as const;
  const s =
    map[status as keyof typeof map] || {
      bg: '#EEF2FF',
      color: '#3730A3',
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
    fontWeight: '800',
    color: '#111827',
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
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tripIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripRoute: {
    color: '#111827',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});
