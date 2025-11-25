import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../utils/supabase";

type DriverInfo = {
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_driver_url: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_plate: string | null;
  vehicle_color: string | null;
};

export default function DriverInfoScreen() {
  const { trip_id } = useLocalSearchParams<{ trip_id: string }>();
  const [info, setInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!trip_id) return;

        // 1) obtener viaje
        const { data: trip, error: tripError } = await supabase
          .from("viajes")
          .select("driver_id, vehicle_id")
          .eq("id", trip_id)
          .single();

        if (tripError || !trip) {
          console.log("Error cargando viaje:", tripError?.message);
          return;
        }

        // 2) obtener datos del conductor
        const { data: driver, error: driverError } = await supabase
          .from("usuarios")
          .select("first_name, last_name, phone, avatar_driver_url")
          .eq("id", trip.driver_id)
          .single();

        if (driverError || !driver) {
          console.log("Error cargando conductor:", driverError?.message);
          return;
        }

        // 3) obtener datos del vehículo
        let vehicleData = null;
        if (trip.vehicle_id) {
          const { data: veh, error: vehError } = await supabase
            .from("vehiculos")
            .select("brand, model, year, plate, color")
            .eq("id", trip.vehicle_id)
            .single();

          if (!vehError && veh) {
            vehicleData = veh;
          }
        }

        setInfo({
          first_name: driver.first_name,
          last_name: driver.last_name,
          phone: driver.phone,
          avatar_driver_url: driver.avatar_driver_url,
          vehicle_brand: vehicleData?.brand ?? null,
          vehicle_model: vehicleData?.model ?? null,
          vehicle_year: vehicleData?.year ?? null,
          vehicle_plate: vehicleData?.plate ?? null,
          vehicle_color: vehicleData?.color ?? null,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [trip_id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!info) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No se pudo cargar la información del conductor.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#111" />
        </Pressable>
        <Text style={styles.title}>Conductor</Text>
      </View>

      <View style={styles.card}>
        {/* Foto del conductor */}
        {info.avatar_driver_url ? (
          <Image
            source={{ uri: info.avatar_driver_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={40} color="#9CA3AF" />
          </View>
        )}
        <Text style={styles.name}>
          {info.first_name} {info.last_name}
        </Text>
        {info.phone && <Text style={styles.phone}>📞 {info.phone}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vehículo</Text>
        <Text style={styles.vehicleText}>
          {info.vehicle_brand} {info.vehicle_model} {info.vehicle_year}
        </Text>
        <Text style={styles.vehicleText}>Placa: {info.vehicle_plate}</Text>
        <Text style={styles.vehicleText}>Color: {info.vehicle_color}</Text>

        {/* Aquí pondremos la foto del carro (API o imagen mock) */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 10,
  },
  avatarFallback: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { textAlign: "center", fontSize: 18, fontWeight: "800" },
  phone: { textAlign: "center", marginTop: 4, color: "#4B5563" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  vehicleText: { fontSize: 14, color: "#4B5563", marginBottom: 2 },
});
