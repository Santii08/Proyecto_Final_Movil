import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

export default function RegisterDriver() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleRegister = () => {
    console.log('Registro conductor:', { name, email, vehicle, plate, password });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {/* Header */}
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
                  <Ionicons name="car-sport-outline" size={28} color="#2F6CF4" />
                </View>
                <View>
                  <Text style={styles.brand}>UniRide</Text>
                  <Text style={styles.subtitle}>Crea tu perfil de conductor</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Tarjeta */}
            <View style={styles.card}>
              <Text style={styles.title}>Registro Conductor</Text>

              {/* Nombre */}
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Correo */}
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Modelo */}
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="car-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Modelo del vehículo"
                  placeholderTextColor="#6B7280"
                  value={vehicle}
                  onChangeText={setVehicle}
                />
              </View>

              {/* Placa */}
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="card-text-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Placa del vehículo"
                  placeholderTextColor="#6B7280"
                  value={plate}
                  onChangeText={setPlate}
                />
              </View>

              {/* Contraseña */}
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={secure}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setSecure(!secure)} hitSlop={10}>
                  <Ionicons
                    name={secure ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#4B5563" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={secureConfirm}
                  value={confirm}
                  onChangeText={setConfirm}
                />
                <Pressable onPress={() => setSecureConfirm(!secureConfirm)} hitSlop={10}>
                  <Ionicons
                    name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>

              {/* Botón */}
              <Pressable onPress={() => router.push('/(main)/indexDriver')} style={{ width: '100%' }}>
                <LinearGradient
                  colors={['#28A745', '#34D058']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Registrarse</Text>
                </LinearGradient>
              </Pressable>
            </View>
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
    marginTop: 40,
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
    shadowColor: '#28A745',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
