import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export default function CreateTrip() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const swapLocations = () => {
    setOrigin(prev => {
      const o = prev;
      setDestination(o2 => (o2 === '' ? '' : prev));
      return destination;
    });
  };

  const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

const formatTime = (t: Date) =>
  t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

  const handlePublish = () => {
    if (!origin || !destination || !seats || !price) {
      alert('Completa origen, destino, cupos y precio.');
      return;
    }
    const payload = {
      origin,
      destination,
      date: date.toISOString().split('T')[0],
      time: `${time.getHours().toString().padStart(2, '0')}:${time
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      seats: Number(seats),
      price: Number(price),
    };
    console.log('Publicar viaje:', payload);
    alert('¡Viaje publicado!');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            {/* Header curvo */}
            <LinearGradient
              colors={['#2F6CF4', '#00C2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              {/* Burbujas decorativas */}
              <LinearGradient
                colors={['#ffffff55', '#ffffff10']}
                style={[styles.bubble, { width: 180, height: 180, borderRadius: 90, top: -40, right: -40 }]}
              />
              <LinearGradient
                colors={['#ffffff55', '#ffffff10']}
                style={[styles.bubble, { width: 120, height: 120, borderRadius: 60, bottom: -20, left: -20 }]}
              />
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="navigate-outline" size={26} color="#2F6CF4" />
                </View>
                <View>
                  <Text style={styles.brand}>UniRide</Text>
                  <Text style={styles.subtitle}>Publica tu viaje como conductor</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Tarjeta */}
            <View style={styles.card}>
              <Text style={styles.title}>Crear viaje</Text>

              {/* Origen */}
              <View style={styles.inputRow}>
                <Ionicons name="pin-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Origen (ej. Universidad de La Sabana)"
                  placeholderTextColor="#6B7280"
                  value={origin}
                  onChangeText={setOrigin}
                />
                <Pressable onPress={swapLocations} hitSlop={10} style={styles.swapBtn}>
                  <Ionicons name="swap-vertical-outline" size={20} color="#2F6CF4" />
                </Pressable>
              </View>

              {/* Destino */}
              <View style={styles.inputRow}>
                <Ionicons name="flag-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Destino (ej. Portal Norte)"
                  placeholderTextColor="#6B7280"
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              {/* Fecha */}
              <Pressable style={styles.inputRow} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar-outline" size={20} color="#4B5563" style={styles.icon} />
                <Text style={[styles.input, { paddingTop: 13 }]}>
                  {formatDate(date)}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#6B7280" />
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
                <MaterialCommunityIcons name="clock-outline" size={20} color="#4B5563" style={styles.icon} />
                <Text style={[styles.input, { paddingTop: 13 }]}>{formatTime(time)}</Text>
                <Ionicons name="chevron-down" size={18} color="#6B7280" />
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

              {/* Cupos */}
              <View style={styles.inputRow}>
                <Ionicons name="people-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Cupos disponibles (ej. 3)"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>

              {/* Precio */}
              <View style={styles.inputRow}>
                <Ionicons name="cash-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Precio por pasajero (COP)"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              {/* Botón */}
              <Pressable onPress={handlePublish} style={{ width: '100%' }}>
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryText}>Publicar viaje</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Nota legal */}
            <Text style={styles.legal}>
              Recuerda cumplir con las normas de tránsito y las políticas de UniRide.
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  header: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 38,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bubble: { position: 'absolute', opacity: 0.9 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logoBadge: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#E6F7FF', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    marginTop: -80,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },

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
    marginBottom: 14,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },

  swapBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
  },

  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 6,
    shadowColor: '#2F6CF4',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  legal: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 18,
    paddingHorizontal: 24,
  },
});
