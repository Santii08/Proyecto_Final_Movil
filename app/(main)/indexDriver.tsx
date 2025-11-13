import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';

export default function DriverDashboard() {
  const router = useRouter();
  const [available, setAvailable] = useState(true);

  // Mock data
  const earningsToday = 82000;
  const weeklyGoal = 300000;
  const weeklyProgress = Math.min(earningsToday / weeklyGoal, 1);

  const upcoming = [
    { id: '1', origin: 'Univ. La Sabana', dest: 'Portal Norte', time: '13:40', seats: 3, price: 7000, status: 'Pendiente' },
    { id: '2', origin: 'Chía Centro', dest: 'Calle 100', time: '16:10', seats: 2, price: 9000, status: 'Confirmado' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <LinearGradient
          colors={['#2F6CF4', '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* burbujas */}
          <LinearGradient colors={['#ffffff66', '#ffffff10']} style={[styles.bubble, { top: -30, right: -40, width: 160, height: 160, borderRadius: 80 }]} />
          <LinearGradient colors={['#ffffff55', '#ffffff10']} style={[styles.bubble, { bottom: -20, left: -20, width: 120, height: 120, borderRadius: 60 }]} />

          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#2F6CF4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>Hola, Daniel</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD166" />
                <Text style={styles.ratingText}>4.9 • 256 viajes</Text>
              </View>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{available ? 'Disponible' : 'No disponible'}</Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                thumbColor={available ? '#fff' : '#fff'}
                trackColor={{ false: '#BFC8FF', true: '#34D399' }}
              />
            </View>
          </View>

          {/* Meta rápida / resumen */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Hoy</Text>
              <Text style={styles.summaryValue}>${earningsToday.toLocaleString('es-CO')}</Text>
            </View>
            <View style={[styles.summaryItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.summaryLabel}>Meta semanal</Text>
              <Text style={styles.summaryValue}>${weeklyGoal.toLocaleString('es-CO')}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${weeklyProgress * 100}%` }]} />
          </View>
        </LinearGradient>

        {/* TARJETA ACCIONES RÁPIDAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionBtn
              icon={<Ionicons name="add-circle-outline" size={22} color="#2F6CF4" />}
              label="Publicar viaje"
              onPress={() => router.push('/(main)/indexDriver')}
            />
            <ActionBtn
              icon={<MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#2F6CF4" />}
              label="Mis viajes"
              onPress={() => router.push('/(main)/indexDriver')}
            />
            <ActionBtn
              icon={<MaterialCommunityIcons name="car-cog" size={22} color="#2F6CF4" />}
              label="Vehículo"
              onPress={() => router.push('/(main)/indexDriver')}
            />
            <ActionBtn
              icon={<Ionicons name="headset-outline" size={22} color="#2F6CF4" />}
              label="Soporte"
              onPress={() => router.push('/(main)/indexDriver')}
            />
          </View>
        </View>

        {/* PRÓXIMOS VIAJES */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Próximos viajes</Text>
            <Pressable onPress={() => router.push('/(main)/indexDriver')}>
              <Text style={styles.link}>Ver todos</Text>
            </Pressable>
          </View>

          {upcoming.map(item => (
            <View key={item.id} style={styles.tripRow}>
              <View style={styles.tripIcon}>
                <Ionicons name="navigate-outline" size={18} color="#2F6CF4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripRoute}>{item.origin} → {item.dest}</Text>
                <View style={styles.tripMeta}>
                  <Badge icon="time-outline" text={item.time} />
                  <Badge icon="people-outline" text={`${item.seats} cupos`} />
                  <Badge icon="cash-outline" text={`$${item.price.toLocaleString('es-CO')}`} />
                </View>
              </View>
              <StatusPill status={item.status} />
            </View>
          ))}
        </View>

        {/* CTA STICKY */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <Pressable
        style={styles.fabWrap}
        onPress={() => router.push('/(main)/indexDriver')}
      >
        <LinearGradient
          colors={['#2F6CF4', '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Publicar viaje</Text>
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

/* ---------- COMPONENTES AUXILIARES ---------- */
import { ReactNode } from 'react';

type ActionBtnProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function ActionBtn({ icon, label, onPress }: ActionBtnProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

type BadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function Badge({ icon, text }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={14} color="#4B5563" />
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

type StatusPillProps = {
  status: 'Pendiente' | 'Confirmado' | 'Cancelado' | string;
};

function StatusPill({ status }: StatusPillProps) {
  const map = {
    Pendiente: { bg: '#FFF7ED', color: '#C2410C' },
    Confirmado: { bg: '#ECFDF5', color: '#047857' },
    Cancelado: { bg: '#FEF2F2', color: '#B91C1C' },
  } as const;
  const s = map[status as keyof typeof map] || { bg: '#EEF2FF', color: '#3730A3' };

  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.color }]}>{status}</Text>
    </View>
  );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    opacity: 0.9,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 3,
  },
  welcome: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    color: '#E6F7FF',
    fontSize: 13,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontWeight: '700', marginRight: 6 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  summaryItem: {},
  summaryLabel: { color: '#E6F7FF', fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: '800' },

  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff33',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
  },

  /* Cards */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },

  /* Actions */
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 14,
  },
  link: { color: '#2F6CF4', fontWeight: '700' },

  /* Trips */
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripRoute: {
    color: '#111827',
    fontWeight: '700',
  },
  tripMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: { color: '#4B5563', fontSize: 12 },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { fontWeight: '800', fontSize: 12 },

  /* FAB */
  fabWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },
  fab: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
