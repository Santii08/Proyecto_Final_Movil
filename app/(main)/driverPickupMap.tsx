import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, {
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
    Region,
} from "react-native-maps";

import { GEOAPIFY_API_KEY } from "../config/geoapify";
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type DriverTrip = {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
};

type PickupRequest = {
  id: string; // id de la reserva
  trip_id: string;
  passenger_id: string;
  status: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
};

const { width, height } = Dimensions.get("window");

const DriverPickupMap: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const mapRef = useRef<MapView | null>(null);

  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  const [region, setRegion] = useState<Region | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [repositionMode, setRepositionMode] = useState(false);
  const [centerCoord, setCenterCoord] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1️⃣ Cargar viajes del conductor + reservas
  useEffect(() => {
    const loadData = async () => {
      console.log("🔵 DriverPickupMap: montando componente...");

      if (!user) {
        console.log(
          "⚠ DriverPickupMap: No hay usuario en AuthContext. No se pueden cargar viajes."
        );
        setLoading(false);
        return;
      }

      console.log("✅ DriverPickupMap: Usuario en contexto:", {
        id: user.id,
        email: user.email,
        rol: user.rol,
      });

      try {
        setLoading(true);

        // Viajes del conductor
        const { data: tripsData, error: tripsError } = await supabase
          .from("viajes")
          .select(
            "id, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng"
          )
          .eq("driver_id", user.id);

        if (tripsError) {
          console.log(
            "❌ DriverPickupMap: Error cargando viajes del conductor:",
            tripsError.message
          );
          setLoading(false);
          return;
        }

        const driverTrips = (tripsData ?? []) as DriverTrip[];
        setTrips(driverTrips);

        console.log(
          "🔎 DriverPickupMap: Viajes encontrados:",
          driverTrips.length,
          driverTrips
        );

        if (driverTrips.length === 0) {
          console.log(
            "⚠ DriverPickupMap: El conductor no tiene viajes creados."
          );
          setLoading(false);
          return;
        }

        const tripIds = driverTrips.map((t) => t.id);
        console.log(
          "🔎 DriverPickupMap: tripIds a consultar en reservas:",
          tripIds
        );

        // Reservas de esos viajes (todas, para debug; luego puedes filtrar por status)
        const { data: reservasData, error: reservasError } = await supabase
          .from("reservas")
          .select("id, trip_id, passenger_id, status, pickup_lat, pickup_lng")
          .in("trip_id", tripIds);

        if (reservasError) {
          console.log(
            "❌ DriverPickupMap: Error cargando reservas:",
            reservasError.message
          );
        }

        const reqs = (reservasData ?? []) as PickupRequest[];
        setRequests(reqs);

        console.log(
          "🔎 DriverPickupMap: Reservas encontradas:",
          reqs.length,
          reqs
        );

        // Seleccionar viaje inicial
        const firstTrip = driverTrips[0];
        setSelectedTripId(firstTrip.id);

        // Región inicial (aprox. entre origen y destino)
        if (
          firstTrip.origin_lat != null &&
          firstTrip.origin_lng != null &&
          firstTrip.destination_lat != null &&
          firstTrip.destination_lng != null
        ) {
          const midLat =
            (firstTrip.origin_lat + firstTrip.destination_lat) / 2;
          const midLng =
            (firstTrip.origin_lng + firstTrip.destination_lng) / 2;
          const latDiff = Math.abs(
            firstTrip.origin_lat - firstTrip.destination_lat
          );
          const lngDiff = Math.abs(
            firstTrip.origin_lng - firstTrip.destination_lng
          );

          const initialRegion: Region = {
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: latDiff * 2.2 + 0.02,
            longitudeDelta: lngDiff * 2.2 + 0.02,
          };
          setRegion(initialRegion);
          setCenterCoord({ latitude: midLat, longitude: midLng });

          console.log(
            "✅ DriverPickupMap: Región inicial calculada:",
            initialRegion
          );
        } else {
          const fallbackRegion: Region = {
            latitude: 4.6486259,
            longitude: -74.2478965,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(fallbackRegion);
          setCenterCoord({
            latitude: fallbackRegion.latitude,
            longitude: fallbackRegion.longitude,
          });
          console.log(
            "⚠ DriverPickupMap: Primer viaje sin coords completas, usando Bogotá centro:",
            fallbackRegion
          );
        }

        // Ruta del primer viaje
        await loadRouteForTrip(firstTrip);
      } catch (err: any) {
        console.log(
          "❌ DriverPickupMap: Error inesperado cargando datos:",
          err.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const loadRouteForTrip = async (trip: DriverTrip) => {
    if (
      trip.origin_lat == null ||
      trip.origin_lng == null ||
      trip.destination_lat == null ||
      trip.destination_lng == null
    ) {
      console.log(
        "⚠ DriverPickupMap: No hay lat/lng completos para el viaje:",
        trip
      );
      setRouteCoords([]);
      return;
    }

    try {
      setLoadingRoute(true);
      const url = `https://api.geoapify.com/v1/routing?waypoints=${trip.origin_lat},${trip.origin_lng}|${trip.destination_lat},${trip.destination_lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;

      console.log("🔎 DriverPickupMap: Llamando a Geoapify:", url);

      const res = await fetch(url);
      const data = await res.json();

      const feature = data.features?.[0];
      if (!feature) {
        console.log(
          "⚠ DriverPickupMap: Geoapify no devolvió ruta para el viaje",
          trip.id
        );
        setRouteCoords([]);
        return;
      }

      const coords: Coordinate[] =
        feature.geometry.coordinates[0].map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        }));

      console.log(
        "✅ DriverPickupMap: Ruta recibida de Geoapify, nº de puntos:",
        coords.length
      );

      setRouteCoords(coords);
    } catch (err: any) {
      console.log("❌ DriverPickupMap: Error cargando ruta:", err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const currentTrip = trips.find((t) => t.id === selectedTripId) || null;

  // Si quisieras filtrar por estado:
  // const currentRequests = requests.filter(r => r.trip_id === selectedTripId && r.status === 'confirmada');
  const currentRequests = requests.filter(
    (r) => r.trip_id === selectedTripId
  );

  console.log(
    "🔎 DriverPickupMap: currentTripId:",
    selectedTripId,
    "currentRequests:",
    currentRequests.length,
    currentRequests
  );

  // 2️⃣ Ajustar la cámara para que se vean origen, destino y pickups
  useEffect(() => {
    if (!mapRef.current || !currentTrip) return;

    const points: Coordinate[] = [];

    if (currentTrip.origin_lat != null && currentTrip.origin_lng != null) {
      points.push({
        latitude: currentTrip.origin_lat,
        longitude: currentTrip.origin_lng,
      });
    }

    if (
      currentTrip.destination_lat != null &&
      currentTrip.destination_lng != null
    ) {
      points.push({
        latitude: currentTrip.destination_lat,
        longitude: currentTrip.destination_lng,
      });
    }

    currentRequests.forEach((r) => {
      if (r.pickup_lat != null && r.pickup_lng != null) {
        points.push({
          latitude: r.pickup_lat,
          longitude: r.pickup_lng,
        });
      }
    });

    if (points.length === 0) return;

    console.log(
      "📐 DriverPickupMap: Ajustando cámara para estos puntos:",
      points
    );

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, bottom: 220, left: 40, right: 40 },
      animated: true,
    });
  }, [currentTrip, currentRequests.length, routeCoords.length]);

  const onRegionChangeComplete = (reg: Region) => {
    if (!repositionMode) return;
    setRegion(reg);
    setCenterCoord({ latitude: reg.latitude, longitude: reg.longitude });
  };

  const handleAccept = async () => {
    if (!selectedRequestId) return;
    try {
      setSaving(true);
      console.log(
        "🟢 DriverPickupMap: Aceptando recogida, reservaId:",
        selectedRequestId
      );

      const { error } = await supabase
        .from("reservas")
        .update({ status: "confirmada", driver_seen: true })
        .eq("id", selectedRequestId);

      if (error) {
        console.log("❌ Error aceptando recogida:", error.message);
        Alert.alert("Error", "No se pudo aceptar la recogida.");
        return;
      }

      Alert.alert("Recogida aceptada", "El pasajero será notificado.");

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequestId ? { ...r, status: "confirmada" } : r
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStartReposition = () => {
    if (!selectedRequestId || !currentTrip) return;
    setRepositionMode(true);

    console.log(
      "🟡 DriverPickupMap: Modo proponer nuevo punto para reserva:",
      selectedRequestId
    );

    if (currentTrip.origin_lat != null && currentTrip.origin_lng != null) {
      const reg: Region = {
        latitude: currentTrip.origin_lat,
        longitude: currentTrip.origin_lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(reg);
      setCenterCoord({ latitude: reg.latitude, longitude: reg.longitude });
    }
  };

  const handleConfirmReposition = async () => {
    if (!selectedRequestId || !centerCoord) return;
    try {
      setSaving(true);
      console.log(
        "🟡 DriverPickupMap: Confirmando nuevo punto:",
        selectedRequestId,
        centerCoord
      );

      const { error } = await supabase
        .from("reservas")
        .update({
          pickup_lat: centerCoord.latitude,
          pickup_lng: centerCoord.longitude,
          status: "counter_proposed",
          driver_seen: true,
        })
        .eq("id", selectedRequestId);

      if (error) {
        console.log("❌ Error proponiendo nuevo punto:", error.message);
        Alert.alert("Error", "No se pudo proponer el nuevo punto.");
        return;
      }

      Alert.alert(
        "Punto propuesto",
        "Se envió al pasajero un nuevo punto de recogida."
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequestId
            ? {
                ...r,
                pickup_lat: centerCoord.latitude,
                pickup_lng: centerCoord.longitude,
                status: "counter_proposed",
              }
            : r
        )
      );
      setRepositionMode(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !region || !currentTrip) {
    console.log("⚠ DriverPickupMap: loading/region/currentTrip:", {
      loading,
      region,
      currentTrip,
    });
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2F6CF4" />
        <Text style={{ marginTop: 10 }}>Cargando recogidas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.topTitle}>Puntos de recogida</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Chips de viajes */}
      <View style={styles.tripChips}>
        {trips.map((t) => (
          <Pressable
            key={t.id}
            style={[
              styles.tripChip,
              selectedTripId === t.id && styles.tripChipSelected,
            ]}
            onPress={async () => {
              console.log("🔁 DriverPickupMap: cambiando a viaje:", t.id);
              setSelectedTripId(t.id);
              setSelectedRequestId(null);
              await loadRouteForTrip(t);
            }}
          >
            <Text
              style={[
                styles.tripChipText,
                selectedTripId === t.id && styles.tripChipTextSelected,
              ]}
            >
              {t.origin} → {t.destination}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Mapa */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {/* Ruta del viaje */}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} />
          )}

          {/* Origen */}
          {currentTrip.origin_lat != null &&
            currentTrip.origin_lng != null && (
              <Marker
                coordinate={{
                  latitude: currentTrip.origin_lat,
                  longitude: currentTrip.origin_lng,
                }}
                pinColor="green"
                title="Origen del viaje"
              />
            )}

          {/* Destino */}
          {currentTrip.destination_lat != null &&
            currentTrip.destination_lng != null && (
              <Marker
                coordinate={{
                  latitude: currentTrip.destination_lat,
                  longitude: currentTrip.destination_lng,
                }}
                pinColor="red"
                title="Destino del viaje"
              />
            )}

          {/* Puntos de recogida */}
          {currentRequests.map((r) => {
            if (r.pickup_lat == null || r.pickup_lng == null) {
              console.log(
                "ℹ DriverPickupMap: reserva sin coords, NO se pinta marcador:",
                r
              );
              return null;
            }

            console.log(
              "📍 DriverPickupMap: pintando marcador de recogida para reserva:",
              r.id,
              "coords:",
              r.pickup_lat,
              r.pickup_lng
            );

            return (
              <Marker
                key={r.id}
                coordinate={{
                  latitude: r.pickup_lat,
                  longitude: r.pickup_lng,
                }}
                pinColor={selectedRequestId === r.id ? "#1D4ED8" : "#F97316"}
                title="Punto de recogida"
                description={r.status}
                onPress={() => {
                  console.log(
                    "🟢 DriverPickupMap: marcador seleccionado:",
                    r
                  );
                  setSelectedRequestId(r.id);
                }}
              />
            );
          })}
        </MapView>

        {/* Pin central en modo proponer nuevo punto */}
        {repositionMode && (
          <View pointerEvents="none" style={styles.centerMarker}>
            <Ionicons name="location-sharp" size={32} color="#2563EB" />
          </View>
        )}

        {/* Panel inferior */}
        <View style={styles.bottomSheet}>
          {currentRequests.length === 0 ? (
            <Text style={styles.noRequests}>
              No hay solicitudes de recogida para este viaje.
            </Text>
          ) : !selectedRequestId ? (
            <Text style={styles.noRequests}>
              Toca un marcador naranja para gestionar una recogida.
            </Text>
          ) : !repositionMode ? (
            <>
              <Text style={styles.sheetTitle}>Solicitud seleccionada</Text>
              <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: "#10B981" },
                    saving && { opacity: 0.7 },
                  ]}
                  onPress={handleAccept}
                  disabled={saving}
                >
                  <Text style={styles.actionText}>Aceptar</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: "#3B82F6" },
                  ]}
                  onPress={handleStartReposition}
                >
                  <Text style={styles.actionText}>
                    Proponer otro punto
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sheetTitle}>
                Mueve el mapa y confirma el nuevo punto
              </Text>
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#3B82F6", marginTop: 8 },
                  saving && { opacity: 0.7 },
                ]}
                onPress={handleConfirmReposition}
                disabled={saving}
              >
                <Text style={styles.actionText}>
                  {saving ? "Guardando..." : "Confirmar nuevo punto"}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#9CA3AF", marginTop: 8 },
                ]}
                onPress={() => setRepositionMode(false)}
              >
                <Text style={styles.actionText}>Cancelar</Text>
              </Pressable>
            </>
          )}
        </View>

        {loadingRoute && (
          <View style={styles.loadingBadge}>
            <Text style={styles.loadingText}>Calculando ruta...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default DriverPickupMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  tripChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tripChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  tripChipSelected: {
    backgroundColor: "#1D4ED8",
  },
  tripChipText: { fontSize: 12, color: "#111827" },
  tripChipTextSelected: { color: "#FFFFFF" },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width,
    height: height - 56 - 56,
  },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -32,
  },
  bottomSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  noRequests: {
    fontSize: 13,
    color: "#4B5563",
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  loadingBadge: {
    position: "absolute",
    top: 90,
    alignSelf: "center",
    backgroundColor: "#111827DD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  loadingText: {
    color: "#F9FAFB",
    fontSize: 12,
  },
});
