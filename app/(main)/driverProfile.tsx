import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string | null;
};

export default function DriverProfile() {
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const fullName = `${(user as any)?.first_name ?? ''} ${(user as any)?.last_name ?? ''}`.trim();

  /* ================================
        TRAER DATOS DEL CONDUCTOR
  ================================= */
  const fetchVehicles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('driver_id', user.id);

    if (error) {
      console.log('❌ Error trayendo vehículos:', error.message);
      return;
    }

    setVehicles(data as Vehicle[]);
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  /* ================================
          CERRAR SESIÓN
  ================================= */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      {/* HEADER */}
      <LinearGradient
        colors={['#2F6CF4', '#00C2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Flecha atrás */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        {/* Botón Cerrar Sesión */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#fff" />
        </Pressable>

        <View style={styles.headerContent}>
          <Image
            source={{ uri: user.avatar_url || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />

          {/* Nombre completo debajo de la imagen */}
          <Text style={styles.name}>{fullName || 'Conductor UniRide'}</Text>
          {/* 👇 Eliminado: "Conductor desde 2024" */}
          {/* <Text style={styles.subtitle}>Conductor desde 2024</Text> */}
        </View>
      </LinearGradient>

      {/* CARD INFORMACIÓN */}
      <View style={styles.card}>
        {/* Email */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{user.email}</Text>
        </View>

        {/* Teléfono */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{user.phone || 'Sin teléfono'}</Text>
        </View>

        {/* Rating */}
        <View style={styles.row}>
          <Ionicons name="star" size={22} color="#FFD166" />
          <Text style={styles.label}>4.9 ⭐ (256 viajes)</Text>
        </View>

        {/* Vehículos */}
        <Text style={styles.sectionTitle}>Vehículos registrados</Text>

        {vehicles.length === 0 ? (
          <Text style={{ color: '#6B7280' }}>No tienes vehículos aún.</Text>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleRow}>
              <Ionicons name="car-sport-outline" size={22} color="#2F6CF4" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.vehicleText}>
                  {v.brand} {v.model} {v.year}
                </Text>
                <Text style={[styles.vehicleText, { color: '#374151' }]}>
                  Placa: {v.plate}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Button Editar Perfil */}
        <Pressable
          style={styles.button}
          onPress={() => router.push('/(main)/editDriverProfile')}
        >
          <LinearGradient
            colors={['#28A745', '#34D058']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Text style={styles.buttonText}>Editar perfil</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  logoutBtn: {
    position: 'absolute',
    top: 70,
    right: 20,
  },
  headerContent: { alignItems: 'center', marginTop: 50 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#E6F7FF', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  label: { fontSize: 16, color: '#111827', fontWeight: '500' },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  vehicleText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },

  button: { marginTop: 18 },
  gradient: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
