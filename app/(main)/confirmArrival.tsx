import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function ConfirmArrival() {
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Pedir permiso la primera vez
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    // aún cargando el estado de permisos
    return <View style={styles.center}><Text>Cargando cámara...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Necesitamos permiso para usar la cámara.</Text>
      </View>
    );
  }

  const handleScan = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    try {
      const { data } = result;
      const payload = JSON.parse(data);

      if (payload.type !== "confirm_arrival") {
        Alert.alert("Código inválido", "Este QR no corresponde a un viaje de UniRide.");
        setScanned(false);
        return;
      }

      const trip_id = payload.trip_id;

      // 🔹 Aquí luego conectas con Supabase para guardar la confirmación
      // por ahora solo mostramos alerta
      Alert.alert("¡Confirmado!", `Llegada registrada para el viaje ${trip_id}`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);

    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo leer el código QR.");
      setScanned(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        // Solo escanear QR
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {/* Overlay con texto guía */}
      <View style={styles.overlay}>
        <Text style={styles.scanText}>Escanea el QR del conductor</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  msg: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
