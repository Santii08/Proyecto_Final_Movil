import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function EndTripQR() {
  const { trip_id } = useLocalSearchParams();
  const router = useRouter();

  if (!trip_id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se recibió trip_id</Text>
      </View>
    );
  }

  // 🔹 Payload del QR
  const payload = JSON.stringify({
    type: "confirm_arrival",
    trip_id,
    timestamp: Date.now(),
  });

  return (
    <View style={styles.container}>
      
      {/* 🔙 Botón atrás */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={26} color="#111827" />
      </Pressable>

      <Text style={styles.title}>Confirmación de llegada</Text>

      <View style={styles.qrBox}>
        <QRCode value={payload} size={260} />
      </View>

      <Text style={styles.sub}>
        Los pasajeros deben escanear este QR para confirmar que llegaron sanos y salvos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 6,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 20,
  },

  qrBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    marginBottom: 30,
  },

  sub: {
    fontSize: 14,
    color: '#6B7280',
    width: '80%',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 100,
    color: 'red',
    fontSize: 18,
  },
});
