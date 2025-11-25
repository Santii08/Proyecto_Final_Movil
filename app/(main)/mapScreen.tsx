// app/(main)/mapScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
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
import type { Coordinate } from "../types/map.types";
import { supabase } from "../utils/supabase";

const { width, height } = Dimensions.get("window");

const MapScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const tripId = params.trip_id as string;

  // datos del viaje
  const originLat = Number(params.origin_lat);
  const originLng = Number(params.origin_lng);
  const destLat = Number(params.destination_lat);
  const destLng = Number(params.destination_lng);

  const driver = (params.driver as string) || "Conductor UniRide";
  const time = (params.time as string) || "";
  const price = params.price ? Number(params.price) : 0;

  const [region, setRegion] = useState<Region | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [pickupCoord, setPickupCoord] = useState<Coordinate | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1️⃣ Definir región inicial basada en la ruta origen → destino
  useEffect(() => {
    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destLat) ||
      isNaN(destLng)
    ) {
      Alert.alert(
        "Error",
        "Este viaje no tiene coordenadas válidas para mostrar la ruta."
      );
      const fallback: Region = {
        latitude: 4.6486259,
        longitude: -74.2478965,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(fallback);
      setPickupCoord({
        latitude: fallback.latitude,
        longitude: fallback.longitude,
      });
      setLoadingRoute(false);
      return;
    }

    const midLat = (originLat + destLat) / 2;
    const midLng = (originLng + destLng) / 2;
    const latDiff = Math.abs(originLat - destLat);
    const lngDiff = Math.abs(originLng - destLng);

    const initialRegion: Region = {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: latDiff * 2.2 + 0.02,
      longitudeDelta: lngDiff * 2.2 + 0.02,
    };

    setRegion(initialRegion);
    // por defecto, punto de recogida = origen del viaje
    setPickupCoord({ latitude: originLat, longitude: originLng });
  }, [originLat, originLng, destLat, destLng]);

  // 2️⃣ Traer ruta del viaje con Geoapify
  useEffect(() => {
    const fetchRoute = async () => {
      if (
        isNaN(originLat) ||
        isNaN(originLng) ||
        isNaN(destLat) ||
        isNaN(destLng)
      ) {
        return;
      }

      try {
        setLoadingRoute(true);
        const url = `https://api.geoapify.com/v1/routing?waypoints=${originLat},${originLng}|${destLat},${destLng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        const feature = data.features?.[0];
        if (!feature) {
          Alert.alert("Ruta", "No se encontró una ruta entre estos puntos.");
          setLoadingRoute(false);
          return;
        }

        const coords: Coordinate[] =
          feature.geometry.coordinates[0].map((c: number[]) => ({
            latitude: c[1],
            longitude: c[0],
          }));

        setRouteCoords(coords);
      } catch (err) {
        console.log("❌ Error cargando ruta:", err);
        Alert.alert("Error", "No se pudo calcular la ruta del viaje.");
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [originLat, originLng, destLat, destLng]);

  // 3️⃣ Reverse geocoding para el punto de recogida (centro del mapa)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log("❌ Error HTTP reverse geocode:", res.status);
        setLoadingAddress(false);
        return;
      }
      const data: any = await res.json();
      if (!data.results || data.results.length === 0) {
        setAddress("");
        setLoadingAddress(false);
        return;
      }
      const first = data.results[0];
      setAddress(first.formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setLoadingAddress(false);
    } catch (err) {
      console.log("❌ Error reverse geocode:", err);
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    const coord = { latitude: reg.latitude, longitude: reg.longitude };
    setPickupCoord(coord);
    reverseGeocode(reg.latitude, reg.longitude);
  };

  // 4️⃣ Confirmar punto de recogida → crear/actualizar reserva en Supabase
  const handleConfirmPickup = async () => {
    if (!user) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para reservar.");
      return;
    }

    if (!tripId) {
      Alert.alert(
        "Error",
        "No se encontró el identificador del viaje para crear la reserva."
      );
      return;
    }

    if (!pickupCoord) {
      Alert.alert(
        "Punto de recogida",
        "Mueve el mapa para elegir tu punto de recogida."
      );
      return;
    }

    try {
      setSaving(true);

      // 1️⃣ Ver si ya hay reserva para este trip + passenger
      const { data: existing, error: existingError } = await supabase
        .from("reservas")
        .select("*")
        .eq("trip_id", tripId)
        .eq("passenger_id", user.id)
        .maybeSingle();

      if (existingError) {
        console.log("❌ Error buscando reserva previa:", existingError);
      }

      if (existing) {
        // 2️⃣ Actualizar reserva existente
        const { error: updateError } = await supabase
          .from("reservas")
          .update({
            pickup_lat: pickupCoord.latitude,
            pickup_lng: pickupCoord.longitude,
            status: "pending_driver", // esperando al conductor
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("❌ Error actualizando reserva:", updateError.message);
          Alert.alert("Error", "No se pudo actualizar tu reserva.");
          return;
        }
      } else {
        // 3️⃣ Crear nueva reserva
        const { error: insertError } = await supabase.from("reservas").insert({
          trip_id: tripId,
          passenger_id: user.id,
          pickup_lat: pickupCoord.latitude,
          pickup_lng: pickupCoord.longitude,
          status: "pending_driver", // esperando al conductor
        });

        if (insertError) {
          console.error("❌ Error creando reserva:", insertError.message);
          Alert.alert("Error", "No se pudo crear tu reserva.");
          return;
        }
      }

      Alert.alert(
        "Solicitud enviada",
        "Tu punto de recogida fue enviado al conductor. Te avisaremos cuando lo confirme o proponga otro punto.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error("❌ Error guardando reserva:", err.message);
      Alert.alert("Error", "Ocurrió un problema al guardar tu reserva.");
    } finally {
      setSaving(false);
    }
  };

  if (!region) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2F6CF4" />
        <Text style={{ marginTop: 10 }}>Cargando mapa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header estilo simple */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.topTitle}>Selecciona tu punto de recogida</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {/* Ruta del viaje */}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} />
          )}

          {/* Origen del viaje */}
          {!isNaN(originLat) && !isNaN(originLng) && (
            <Marker
              coordinate={{ latitude: originLat, longitude: originLng }}
              pinColor="green"
              title="Origen del viaje"
            />
          )}

          {/* Destino del viaje */}
          {!isNaN(destLat) && !isNaN(destLng) && (
            <Marker
              coordinate={{ latitude: destLat, longitude: destLng }}
              pinColor="red"
              title="Destino del viaje"
            />
          )}
        </MapView>

        {/* Pin fijo en el centro (punto de recogida estilo Uber) */}
        <View pointerEvents="none" style={styles.centerMarker}>
          <Ionicons name="location-sharp" size={32} color="#2563EB" />
        </View>

        {/* Tarjeta con info y dirección del punto de recogida */}
        <View style={styles.bottomSheet}>
          <View style={styles.tripInfoRow}>
            <View>
              <Text style={styles.driverName}>{driver}</Text>
              <Text style={styles.tripDetail}>
                {time} ·{" "}
                {price > 0 ? `$${price.toLocaleString("es-CO")}` : "Precio N/A"}
              </Text>
            </View>
          </View>

          <Text style={styles.addressLabel}>Tu punto de recogida</Text>
          {loadingAddress ? (
            <Text style={styles.addressText}>Buscando dirección...</Text>
          ) : (
            <Text style={styles.addressText}>
              {address ||
                (pickupCoord
                  ? `${pickupCoord.latitude.toFixed(
                      5
                    )}, ${pickupCoord.longitude.toFixed(5)}`
                  : "Mueve el mapa para elegir un punto")}
            </Text>
          )}

          <Pressable
            style={[styles.confirmBtn, saving && { opacity: 0.7 }]}
            onPress={handleConfirmPickup}
            disabled={saving}
          >
            <Text style={styles.confirmText}>
              {saving ? "Guardando..." : "Confirmar punto de recogida"}
            </Text>
          </Pressable>
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

export default MapScreen;

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
  tripInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  driverName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  tripDetail: {
    fontSize: 13,
    color: "#6B7280",
  },
  addressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginTop: 2,
  },
  confirmBtn: {
    marginTop: 10,
    backgroundColor: "#2F6CF4",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
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
