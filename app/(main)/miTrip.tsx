import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MyTrips() {
  const trips = [
    { id: 1, origin: 'Chía', dest: 'La Sabana', time: '7:30', price: 6000, status: 'Activo' },
    { id: 2, origin: 'Portal Norte', dest: 'Cajicá', time: '18:00', price: 7000, status: 'Completado' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FB' }} contentContainerStyle={styles.scroll}>
      <LinearGradient colors={['#2F6CF4', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Mis Viajes</Text>
      </LinearGradient>

      <View style={styles.card}>
        {trips.map(t => (
          <View key={t.id} style={styles.trip}>
            <View style={styles.tripLeft}>
              <Ionicons name="navigate-outline" size={22} color="#2F6CF4" />
              <View>
                <Text style={styles.tripRoute}>{t.origin} → {t.dest}</Text>
                <Text style={styles.tripMeta}>Hora: {t.time} | ${t.price.toLocaleString('es-CO')}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: t.status === 'Activo' ? '#DCFCE7' : '#E0E7FF' }]}>
              <Text style={[styles.statusText, { color: t.status === 'Activo' ? '#047857' : '#1E3A8A' }]}>{t.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 30 },
  header: { height: 120, justifyContent: 'flex-end', padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  trip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 14,
  },
  tripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripRoute: { fontWeight: '700', color: '#111827' },
  tripMeta: { color: '#6B7280', fontSize: 13 },
  statusPill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
  statusText: { fontWeight: '700' },
});
