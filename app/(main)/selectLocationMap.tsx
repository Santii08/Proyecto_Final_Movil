import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { GEOAPIFY_API_KEY } from '../config/geoapify';
import type { Coordinate } from '../types/map.types';

const { width, height } = Dimensions.get('window');

const SelectLocationMap: React.FC = () => {
  const params = useLocalSearchParams();
  const type = (params.type as 'origin' | 'destination') || 'origin';

  const [region, setRegion] = useState<Region | null>(null);
  const [currentCoord, setCurrentCoord] = useState<Coordinate | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // 1️⃣ Obtener ubicación inicial (estilo Uber: centrar mapa en el usuario)
  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Necesitas habilitar la ubicación para seleccionar en el mapa.'
          );
          // Bogotá centro por defecto
          const fallbackRegion: Region = {
            latitude: 4.6486259,
            longitude: -74.2478965,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(fallbackRegion);
          setCurrentCoord({
            latitude: fallbackRegion.latitude,
            longitude: fallbackRegion.longitude,
          });
          setLoadingLocation(false);
          reverseGeocode(fallbackRegion.latitude, fallbackRegion.longitude);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const initialRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };

        setRegion(initialRegion);
        setCurrentCoord({
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
        });
        setLoadingLocation(false);
        reverseGeocode(initialRegion.latitude, initialRegion.longitude);
      } catch (err) {
        console.log('❌ Error obteniendo ubicación:', err);
        Alert.alert('Error', 'No se pudo obtener tu ubicación.');
        const fallbackRegion: Region = {
          latitude: 4.6486259,
          longitude: -74.2478965,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(fallbackRegion);
        setCurrentCoord({
          latitude: fallbackRegion.latitude,
          longitude: fallbackRegion.longitude,
        });
        setLoadingLocation(false);
        reverseGeocode(fallbackRegion.latitude, fallbackRegion.longitude);
      }
    })();
  }, []);

  // 2️⃣ Reverse geocoding (coordenadas → texto)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log('❌ Error HTTP reverse geocode:', res.status);
        setLoadingAddress(false);
        return;
      }
      const data: any = await res.json();
      if (!data.results || data.results.length === 0) {
        setAddress('');
        setLoadingAddress(false);
        return;
      }
      const first = data.results[0];
      setAddress(first.formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setLoadingAddress(false);
    } catch (err) {
      console.log('❌ Error reverse geocode:', err);
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    const coord = { latitude: reg.latitude, longitude: reg.longitude };
    setCurrentCoord(coord);
    reverseGeocode(reg.latitude, reg.longitude);
  };

  // 3️⃣ Confirmar selección y volver a CreateTrip con params
  const handleConfirm = () => {
    if (!currentCoord) {
      Alert.alert('Aviso', 'Aún no se ha seleccionado una ubicación.');
      return;
    }

    const baseParams: Record<string, string> = {};

    // Preservar lo que ya venía
    if (params.origin_name) baseParams.origin_name = String(params.origin_name);
    if (params.origin_lat) baseParams.origin_lat = String(params.origin_lat);
    if (params.origin_lng) baseParams.origin_lng = String(params.origin_lng);
    if (params.destination_name)
      baseParams.destination_name = String(params.destination_name);
    if (params.destination_lat)
      baseParams.destination_lat = String(params.destination_lat);
    if (params.destination_lng)
      baseParams.destination_lng = String(params.destination_lng);

    if (type === 'origin') {
      baseParams.origin_name = address || baseParams.origin_name || '';
      baseParams.origin_lat = currentCoord.latitude.toString();
      baseParams.origin_lng = currentCoord.longitude.toString();
    } else {
      baseParams.destination_name = address || baseParams.destination_name || '';
      baseParams.destination_lat = currentCoord.latitude.toString();
      baseParams.destination_lng = currentCoord.longitude.toString();
    }

    router.push({
      pathname: '/(main)/createTrip',
      params: baseParams,
    });
  };

  if (loadingLocation || !region) {
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
        <Text style={styles.topTitle}>
          Seleccionar {type === 'origin' ? 'origen' : 'destino'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAPA */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        />

        {/* Marker fijo al centro (estilo Uber) */}
        <View pointerEvents="none" style={styles.centerMarker}>
          <Ionicons name="location-sharp" size={32} color="#FF3B30" />
        </View>

        {/* Tarjeta con dirección */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Ubicación seleccionada</Text>
          {loadingAddress ? (
            <Text style={styles.addressText}>Buscando dirección...</Text>
          ) : (
            <Text style={styles.addressText}>
              {address || 'Mueve el mapa para elegir un punto'}
            </Text>
          )}
        </View>

        {/* Botón confirmar */}
        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirmar ubicación</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default SelectLocationMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width,
    height: height - 56,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  addressCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  confirmBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 30,
    backgroundColor: '#2F6CF4',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
