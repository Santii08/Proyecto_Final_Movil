import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

/* ---------- TYPES ---------- */
type Trip = {
  id: string;
  driver: string;
  origin: string;
  destination: string;
  time: string;
  price: number;
  rating: number;
};

/* ---------- MOCK DATA ---------- */
const mockTrips: Trip[] = [
  {
    id: '1',
    driver: 'Carlos Pérez',
    origin: 'Universidad de La Sabana',
    destination: 'Portal Norte',
    time: '13:45',
    price: 7000,
    rating: 4.9,
  },
  {
    id: '2',
    driver: 'María López',
    origin: 'Chía Centro',
    destination: 'Calle 100',
    time: '14:10',
    price: 9000,
    rating: 4.8,
  },
  {
    id: '3',
    driver: 'Andrés Gómez',
    origin: 'La Caro',
    destination: 'Unicentro',
    time: '15:00',
    price: 8500,
    rating: 5.0,
  },
];

const PassengerHome: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredTrips = mockTrips.filter(
    t =>
      t.origin.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header Curvo */}
        <LinearGradient
          colors={['#2F6CF4', '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcome}>Hola, Juan 👋</Text>
              <Text style={styles.subtext}>¿A dónde quieres ir hoy?</Text>
            </View>
            <Ionicons name="person-circle-outline" size={40} color="#fff" onPress={() => router.push('/(main)/driverProfile')}/>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar destino o punto de partida"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </LinearGradient>

        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <ActionButton
            icon={<Ionicons name="time-outline" size={22} color="#2F6CF4" />}
            label="Historial"
          />
          <ActionButton
            icon={<MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#2F6CF4" />}
            label="Mis reservas"
          />
          <ActionButton
            icon={<Ionicons name="headset-outline" size={22} color="#2F6CF4" />}
            label="Soporte"
          />
        </View>

        {/* Lista de viajes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Viajes disponibles</Text>

          {filteredTrips.length === 0 ? (
            <Text style={styles.noTrips}>No se encontraron viajes</Text>
          ) : (
            <FlatList
              data={filteredTrips}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.tripItem}>
                  <View style={styles.tripLeft}>
                    <Ionicons name="car-outline" size={22} color="#2F6CF4" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripRoute}>
                        {item.origin} → {item.destination}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {item.time} | ${item.price.toLocaleString('es-CO')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.driverName}>{item.driver}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFD166" />
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <Pressable style={styles.reserveBtn}>
                      <Text style={styles.reserveText}>Reservar</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PassengerHome;

/* ---------- COMPONENTE BOTÓN RÁPIDO ---------- */
type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
};

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label }) => (
  <View style={styles.actionBtn}>
    <View style={styles.actionIcon}>{icon}</View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  welcome: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtext: { color: '#E6F7FF', fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    color: '#111827',
    fontSize: 15,
  },

  /* Acciones rápidas */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    marginHorizontal: 12,
  },
  actionBtn: { alignItems: 'center', width: 90 },
  actionIcon: {
    backgroundColor: '#EEF4FF',
    borderRadius: 14,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937' },

  /* Lista de viajes */
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 18,
    marginTop: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  noTrips: { textAlign: 'center', color: '#6B7280', marginTop: 12 },
  tripItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 14,
  },
  tripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  tripRoute: { fontWeight: '700', color: '#111827' },
  tripMeta: { color: '#6B7280', fontSize: 13 },
  driverName: { fontWeight: '600', color: '#1E3A8A', fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  ratingText: { marginLeft: 4, color: '#4B5563', fontSize: 12 },
  reserveBtn: {
    backgroundColor: '#2F6CF4',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  reserveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
