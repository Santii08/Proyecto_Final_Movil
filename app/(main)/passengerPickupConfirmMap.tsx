import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { supabase } from "../utils/supabase";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type TripForMap = {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
};

const { width, height } = Dimensions.get("window");

const PassengerPickupConfirmMap: React.FC = () => {
  const params = useLocalSearchParams();

  const reservaId = params.reserva_id as string;
  const tripId = params.trip_id as string;
  const status = (params.status as string) || "";
  const pickupAddress = (params.pickup_address as string) || "";

  const pickupLat =
    typeof params.pickup_lat === "string" && params.pickup_lat !== ""
      ? parseFloat(params.pickup_lat as string)
      : null;
  const pickupLng =
    typeof params.pickup_lng === "string" && params.pickup_lng !== ""
      ? parseFloat(params.pickup_lng as string)
      : null;

  const [trip, setTrip] = useState<TripForMap | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1️⃣ Cargar info del viaje
  useEffect(() => {
    const loadTrip = async () => {
      try {
        if (!tripId) {
          console.log(
            "⚠ passengerPickupConfirmMap: no llegó tripId en params"
          );
          setLoading(false);
          return;
        }

        console.log(
          "🔎 passengerPickupConfirmMap: cargando viaje para tripId:",
          tripId
        );

        const { data, error } = await supabase
          .from("viajes")
          .select(
            "id, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng"
          )
          .eq("id", tripId)
          .single();

        if (error) {
          console.log("❌ Error cargando viaje para mapa:", error.message);
          setLoading(false);
          return;
        }

        const t = data as TripForMap;
        setTrip(t);

        if (
          t.origin_lat != null &&
          t.origin_lng != null &&
          t.destination_lat != null &&
          t.destination_lng != null
        ) {
          const midLat = (t.origin_lat + t.destination_lat) / 2;
          const midLng = (t.origin_lng + t.destination_lng) / 2;
          const latDiff = Math.abs(t.origin_lat - t.destination_lat);
          const lngDiff = Math.abs(t.origin_lng - t.destination_lng);

          const initialRegion: Region = {
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: latDiff * 2.2 + 0.02,
            longitudeDelta: lngDiff * 2.2 + 0.02,
          };

          setRegion(initialRegion);
        } else {
          console.log(
            "⚠ passengerPickupConfirmMap: viaje sin coordenadas completas"
          );
        }

        await loadRouteForTrip(t);
      } catch (err: any) {
        console.log(
          "❌ Excepción cargando viaje en passengerPickupConfirmMap:",
          err.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  // 2️⃣ Cargar ruta origen → destino
  const loadRouteForTrip = async (t: TripForMap) => {
    if (
      t.origin_lat == null ||
      t.origin_lng == null ||
      t.destination_lat == null ||
      t.destination_lng == null
    ) {
      setRouteCoords([]);
      return;
    }

    try {
      setLoadingRoute(true);
      const url = `https://api.geoapify.com/v1/routing?waypoints=${t.origin_lat},${t.origin_lng}|${t.destination_lat},${t.destination_lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      const feature = data.features?.[0];
      if (!feature) {
        console.log("⚠ No se encontró ruta para el viaje en confirmMap");
        setRouteCoords([]);
        return;
      }

      const coords: Coordinate[] =
        feature.geometry.coordinates[0].map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        }));

      console.log(
        "✅ passengerPickupConfirmMap: ruta recibida, nº puntos:",
        coords.length
      );
      setRouteCoords(coords);
    } catch (err) {
      console.log("❌ Error cargando ruta en passengerPickupConfirmMap:", err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleConfirm = async () => {
    if (!reservaId) {
      console.log("⚠ passengerPickupConfirmMap: no hay reservaId");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("reservas")
        .update({
          status: "confirmed",
          passenger_seen: true,
        })
        .eq("id", reservaId);

      if (error) {
        console.log(
          "❌ Error confirmando reserva desde mapa:",
          error.message
        );
        Alert.alert("Error", "No se pudo confirmar el viaje.");
        return;
      }

      Alert.alert("¡Listo!", "Tu viaje fue confirmado.", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(main)/indexPassanger");
          },
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!reservaId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("reservas")
        .update({
          status: "cancelled",
          passenger_seen: true,
        })
        .eq("id", reservaId);

      if (error) {
        console.log("❌ Error cancelando reserva desde mapa:", error.message);
        Alert.alert("Error", "No se pudo cancelar el viaje.");
        return;
      }

      Alert.alert("Viaje cancelado", "Tu reserva fue cancelada.", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(main)/indexPassanger");
          },
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !trip || !region) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2F6CF4" />
        <Text style={{ marginTop: 10 }}>Cargando viaje...</Text>
      </SafeAreaView>
    );
  }

  const statusLabel =
    status === "counter_proposed"
      ? "Propuesta del conductor"
      : "Punto de recogida confirmado";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.topTitle}>Confirma tu recogida</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
        >
          {/* Ruta */}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} />
          )}

          {/* Origen */}
          {trip.origin_lat != null && trip.origin_lng != null && (
            <Marker
              coordinate={{
                latitude: trip.origin_lat,
                longitude: trip.origin_lng,
              }}
              pinColor="green"
              title="Origen"
              description={trip.origin}
            />
          )}

          {/* Destino */}
          {trip.destination_lat != null && trip.destination_lng != null && (
            <Marker
              coordinate={{
                latitude: trip.destination_lat,
                longitude: trip.destination_lng,
              }}
              pinColor="red"
              title="Destino"
              description={trip.destination}
            />
          )}

          {/* Punto de recogida */}
          {pickupLat != null && pickupLng != null && (
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              pinColor="#2563EB"
              title="Punto de recogida"
              description={pickupAddress || statusLabel}
            />
          )}
        </MapView>

        {/* Panel inferior */}
        <View style={styles.bottomSheet}>
          <Text style={styles.routeTitle}>
            {trip.origin} → {trip.destination}
          </Text>
          <Text style={styles.statusText}>{statusLabel}</Text>

          {pickupAddress ? (
            <Text style={styles.addressText}>{pickupAddress}</Text>
          ) : pickupLat != null && pickupLng != null ? (
            <Text style={styles.addressText}>
              Lat: {pickupLat.toFixed(5)} | Lng: {pickupLng.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.addressText}>
              El punto de recogida no tiene dirección registrada.
            </Text>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: "#EF4444" },
                saving && { opacity: 0.7 },
              ]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.actionText}>Cancelar viaje</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: "#22C55E" },
                saving && { opacity: 0.7 },
              ]}
              onPress={handleConfirm}
              disabled={saving}
            >
              <Text style={styles.actionText}>
                {saving ? "Guardando..." : "Confirmar aquí"}
              </Text>
            </Pressable>
          </View>
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

export default PassengerPickupConfirmMap;

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
  mapWrapper: {
    flex: 1,
  },
  map: {
    width,
    height: height - 56,
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
  routeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  statusText: {
    marginTop: 4,
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  addressText: {
    marginTop: 4,
    fontSize: 13,
    color: "#4B5563",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
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
    top: 80,
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
