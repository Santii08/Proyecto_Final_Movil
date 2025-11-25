import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../contexts/AuthContext';
import type { Coordinate } from '../types/map.types';
import { geocodePlace } from '../utils/geocoding';
import { supabase } from '../utils/supabase';

type InputFieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
  driver_id: string;
};

export default function CreateTrip() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { user, setUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);

  // 🔹 vehículos del conductor
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Nombre origen/destino si vienen desde el mapa
  const [origin, setOrigin] = useState<string>(
    (params.origin_name as string) || ''
  );
  const [destination, setDestination] = useState<string>(
    (params.destination_name as string) || ''
  );

  // Coordenadas si vienen desde el mapa
  const [originCoords, setOriginCoords] = useState<Coordinate | null>(
    params.origin_lat && params.origin_lng
      ? {
          latitude: Number(params.origin_lat),
          longitude: Number(params.origin_lng),
        }
      : null
  );

  const [destinationCoords, setDestinationCoords] = useState<Coordinate | null>(
    params.destination_lat && params.destination_lng
      ? {
          latitude: Number(params.destination_lat),
          longitude: Number(params.destination_lng),
        }
      : null
  );

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  /* ================================
        🔄 HIDRATAR USUARIO SI VIENE NULL
  ================================= */
  useEffect(() => {
    const loadUserFromSession = async () => {
      try {
        if (user) return; // ya hay usuario en contexto

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          console.log('⚠ No hay sesión activa en Supabase (CreateTrip)');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profileData) {
          console.warn(
            "⚠ No se encontró fila en 'usuarios' desde CreateTrip:",
            profileError?.message
          );

          const fallbackUser = {
            id: data.user.id,
            email: data.user.email ?? '',
            firstName: data.user.user_metadata?.first_name ?? '',
            lastName: data.user.user_metadata?.last_name ?? '',
            phone: data.user.user_metadata?.phone ?? '',
            plate: data.user.user_metadata?.plate ?? '',
            rol:
              (data.user.user_metadata?.rol as
                | 'pasajero'
                | 'conductor'
                | 'ambos') ?? 'pasajero',
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
        console.error('❌ Error hidratando usuario en CreateTrip:', err.message);
      }
    };

    loadUserFromSession();
  }, [user, setUser]);

  /* ================================
        TRAER VEHÍCULOS DEL CONDUCTOR
  ================================= */
  const fetchVehicles = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('driver_id', user.id);

    if (error) {
      console.log('❌ Error trayendo vehículos en CreateTrip:', error.message);
    } else {
      setVehicles(data as Vehicle[]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  /* ================================
            PUBLICAR VIAJE
  ================================= */
  const handlePublish = async () => {
    console.log('🟦 handlePublish pressed');
    console.log('👤 user en CreateTrip:', user);

    if (!user) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para publicar un viaje.');
      return;
    }

    if (user.rol !== 'conductor' && user.rol !== 'ambos') {
      Alert.alert('Aviso', 'Solo los conductores pueden publicar viajes.');
      return;
    }

    if (!origin || !destination || !seats || !price) {
      Alert.alert('Campos incompletos', 'Completa todos los campos.');
      return;
    }

    if (!selectedVehicleId) {
      Alert.alert('Vehículo requerido', 'Selecciona un vehículo para este viaje.');
      return;
    }

    const seatsNumber = parseInt(seats, 10);
    const priceNumber = parseInt(price, 10);

    if (isNaN(seatsNumber) || seatsNumber <= 0) {
      Alert.alert('Cupos inválidos', 'Ingresa un número válido de cupos.');
      return;
    }

    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio válido por pasajero.');
      return;
    }

    try {
      // 1️⃣ Asegurar coordenadas (si no vienen del mapa, geocode automático)
      let finalOrigin = originCoords;
      let finalDest = destinationCoords;

      if (!finalOrigin) {
        finalOrigin = await geocodePlace(origin);
        if (!finalOrigin) {
          Alert.alert(
            'Error',
            'No se pudo encontrar el origen. Intenta ser más específico.'
          );
          return;
        }
        setOriginCoords(finalOrigin);
      }

      if (!finalDest) {
        finalDest = await geocodePlace(destination);
        if (!finalDest) {
          Alert.alert(
            'Error',
            'No se pudo encontrar el destino. Intenta ser más específico.'
          );
          return;
        }
        setDestinationCoords(finalDest);
      }

      // 2️⃣ Combinar fecha y hora
      const departure = new Date(date);
      departure.setHours(time.getHours(), time.getMinutes(), 0, 0);

      const payload = {
        driver_id: user.id,
        vehicle_id: selectedVehicleId,
        origin,
        destination,
        departure_time: departure.toISOString(),
        price: priceNumber,
        seats_total: seatsNumber,
        seats_available: seatsNumber,
        status: 'publicado',
        origin_lat: finalOrigin.latitude,
        origin_lng: finalOrigin.longitude,
        destination_lat: finalDest.latitude,
        destination_lng: finalDest.longitude,
      };

      console.log('📦 Payload que se va a insertar en viajes:', payload);

      setLoading(true);
      const { data, error } = await supabase
        .from('viajes')
        .insert(payload)
        .select()
        .single();

      console.log('📥 Respuesta de supabase.from("viajes").insert:', { data, error });

      if (error) {
        console.error('❌ Error creando viaje:', error.message);
        Alert.alert('Error', `No se pudo publicar el viaje:\n${error.message}`);
        return;
      }

      Alert.alert('Éxito', '¡Viaje publicado exitosamente!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(main)/indexDriver'),
        },
      ]);
    } catch (e: any) {
      console.error('❌ Excepción creando viaje:', e.message);
      Alert.alert('Error', 'Ocurrió un problema al publicar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  /* ================================
        ABRIR MAPA ESTILO UBER
  ================================= */
  const openMapFor = (type: 'origin' | 'destination') => {
    router.push({
      pathname: '/(main)/selectLocationMap',
      params: {
        type,
        origin_name: origin,
        destination_name: destination,
        ...(originCoords && {
          origin_lat: originCoords.latitude.toString(),
          origin_lng: originCoords.longitude.toString(),
        }),
        ...(destinationCoords && {
          destination_lat: destinationCoords.latitude.toString(),
          destination_lng: destinationCoords.longitude.toString(),
        }),
      },
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F5F7FB' }}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Header */}
            <LinearGradient
              colors={['#2F6CF4', '#00C2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.header,
                { paddingTop: 18 + insets.top },
              ]}
            >
              <Pressable
                onPress={() => router.back()}
                style={{ position: 'absolute', left: 20, top: insets.top + 18 }}
              >
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </Pressable>

              <View style={styles.headerContent}>
                <Text style={styles.brand}>UniRide</Text>
                <Text style={styles.subtitle}>Publicar un nuevo viaje</Text>
              </View>
            </LinearGradient>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Detalles del viaje</Text>

              <InputField
                icon="pin-outline"
                placeholder="Origen"
                value={origin}
                onChangeText={setOrigin}
              />

              <Pressable
                style={styles.mapBtn}
                onPress={() => openMapFor('origin')}
              >
                <Text style={styles.mapBtnText}>Elegir origen en el mapa</Text>
              </Pressable>

              <InputField
                icon="flag-outline"
                placeholder="Destino"
                value={destination}
                onChangeText={setDestination}
              />

              <Pressable
                style={styles.mapBtn}
                onPress={() => openMapFor('destination')}
              >
                <Text style={styles.mapBtnText}>
                  Elegir destino en el mapa
                </Text>
              </Pressable>

              {/* Fecha */}
              <Pressable style={styles.inputRow} onPress={() => setShowDate(true)}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#4B5563"
                  style={styles.icon}
                />
                <Text style={styles.input}>
                  {date.toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </Pressable>
              {showDate && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(e, selected) => {
                    setShowDate(false);
                    if (selected) setDate(selected);
                  }}
                />
              )}

              {/* Hora */}
              <Pressable style={styles.inputRow} onPress={() => setShowTime(true)}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#4B5563"
                  style={styles.icon}
                />
                <Text style={styles.input}>
                  {time.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
              </Pressable>
              {showTime && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour
                  onChange={(e, selected) => {
                    setShowTime(false);
                    if (selected) setTime(selected);
                  }}
                />
              )}

              <InputField
                icon="people-outline"
                placeholder="Cupos disponibles"
                keyboardType="numeric"
                value={seats}
                onChangeText={setSeats}
              />
              <InputField
                icon="cash-outline"
                placeholder="Precio por pasajero (COP)"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              {/* 🔹 Selector de vehículo */}
              <Text style={styles.vehicleLabel}>Vehículo</Text>
              {vehicles.length === 0 ? (
                <Text style={styles.noVehiclesText}>
                  No tienes vehículos registrados. Ve a la sección "Vehículo" para agregar uno.
                </Text>
              ) : (
                <View style={styles.vehicleGrid}>
                  {vehicles.map(v => (
                    <Pressable
                      key={v.id}
                      onPress={() => setSelectedVehicleId(v.id)}
                      style={[
                        styles.vehicleChip,
                        selectedVehicleId === v.id && styles.vehicleChipSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.vehicleColorDot,
                          { backgroundColor: v.color || '#6B7280' },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleChipTitle}>
                          {v.plate}
                        </Text>
                        <Text style={styles.vehicleChipSubtitle}>
                          {v.brand} {v.model} · {v.year}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                onPress={handlePublish}
                style={{ width: '100%' }}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.button, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Publicando...' : 'Publicar viaje'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ icon, ...props }: InputFieldProps) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color="#4B5563" style={styles.icon} />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#6B7280"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  header: {
    width: '100%',
    height: 160,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: { alignItems: 'center' },
  brand: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#E6F7FF', fontSize: 14 },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#111827' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  button: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // 🔹 estilos selector vehículo
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    marginTop: 4,
  },
  noVehiclesText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  vehicleGrid: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  vehicleChipSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  vehicleColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#11182722',
  },
  vehicleChipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleChipSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  // 🔹 botón mapa
  mapBtn: {
    backgroundColor: '#E8F1FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapBtnText: {
    color: '#2F6CF4',
    fontWeight: '700',
    textAlign: 'center',
  },
});