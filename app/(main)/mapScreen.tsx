// /app/(main)/mapScreen.tsx
import React, { useState } from "react";
import { Alert, Dimensions, StyleSheet, View } from "react-native";
import MapView, {
    MapPressEvent,
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
} from "react-native-maps";

import { GEOAPIFY_API_KEY } from "../config/geoapify";
import { Coordinate } from "../types/map.types";

const { width, height } = Dimensions.get("window");

const MapScreen: React.FC = () => {
  // 👇 AQUÍ está la clave: tipar bien los estados
  const [startPoint, setStartPoint] = useState<Coordinate | null>(null);
  const [endPoint, setEndPoint] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);

  const initialRegion = {
    latitude: 4.6486259,
    longitude: -74.2478965,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    if (!startPoint) {
      // primer tap → INICIO
      setStartPoint({ latitude, longitude });
    } else if (!endPoint) {
      // segundo tap → DESTINO + calcular ruta
      const newEnd: Coordinate = { latitude, longitude };
      setEndPoint(newEnd);
      fetchRoute(startPoint, newEnd);
    } else {
      // tercer tap → reiniciar
      setStartPoint({ latitude, longitude });
      setEndPoint(null);
      setRouteCoords([]);
    }
  };

  const fetchRoute = async (start: Coordinate, end: Coordinate): Promise<void> => {
    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.latitude},${start.longitude}|${end.latitude},${end.longitude}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;

      const res = await fetch(url);
      const data: any = await res.json();

      const feature = data.features?.[0];
      if (!feature) {
        Alert.alert("Ruta", "No se encontró una ruta entre estos puntos.");
        return;
      }

      const coords: Coordinate[] = feature.geometry.coordinates[0].map(
        (c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        })
      );

      setRouteCoords(coords);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo calcular la ruta.");
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {startPoint && (
          <Marker coordinate={startPoint} pinColor="green" title="Inicio" />
        )}

        {endPoint && (
          <Marker coordinate={endPoint} pinColor="red" title="Destino" />
        )}

        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
});

export default MapScreen;
