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
    TextInputProps,
    TouchableWithoutFeedback,
    View,
} from 'react-native';


type InputFieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
};

export default function CreateTrip() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const handlePublish = () => {
    if (!origin || !destination || !seats || !price) {
      alert('Completa todos los campos');
      return;
    }
    console.log({ origin, destination, date, time, seats, price });
    alert('¡Viaje publicado exitosamente!');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
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
              style={styles.header}
            >
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
              <InputField
                icon="flag-outline"
                placeholder="Destino"
                value={destination}
                onChangeText={setDestination}
              />

              {/* Fecha */}
              <Pressable style={styles.inputRow} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar-outline" size={20} color="#4B5563" style={styles.icon} />
                <Text style={styles.input}>
                  {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                <MaterialCommunityIcons name="clock-outline" size={20} color="#4B5563" style={styles.icon} />
                <Text style={styles.input}>
                  {time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
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

              <Pressable onPress={handlePublish} style={{ width: '100%' }}>
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Publicar viaje</Text>
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
});
