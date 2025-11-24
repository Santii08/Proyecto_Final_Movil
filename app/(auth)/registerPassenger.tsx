import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
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
import { AuthContext } from '../contexts/AuthContext'; // ajusta ruta si es necesario

export default function RegisterPassenger() {
  const { register } = useContext(AuthContext);

  // leer params de la ruta (ej: phone viene de la pantalla anterior)
  const params = useLocalSearchParams<{
    phone?: string;
    role?: 'driver' | 'passenger';
  }>();

  const phoneFromParams = typeof params.phone === 'string' ? params.phone : '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Contraseñas no coinciden', 'La contraseña y la confirmación deben ser iguales.');
      return;
    }

    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    setLoading(true);
    try {
      const success = await register(
        {
          id: '',
          email: email.trim().toLowerCase(),
          firstName,
          lastName,
          phone: phoneFromParams || null,
          plate: null, // pasajero no tiene placa
          rol: 'pasajero', // 👈 valor que se guarda en la tabla usuarios.rol
        } as any,
        password
      );

      if (success) {
        Alert.alert('Registro exitoso', 'Tu perfil de pasajero ha sido creado.', [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(main)/indexPassanger'),
          },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo completar el registro. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error en register passenger:', error);
      Alert.alert('Error inesperado', 'Ocurrió un problema, inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
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
                style={[
                  styles.bubble,
                  { width: 180, height: 180, borderRadius: 90, top: -40, right: -40 },
                ]}
              />
              <LinearGradient
                colors={['#ffffff55', '#ffffff10']}
                style={[
                  styles.bubble,
                  { width: 120, height: 120, borderRadius: 60, bottom: -20, left: -20 },
                ]}
              />

              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="person-outline" size={28} color="#2F6CF4" />
                </View>
                <View>
                  <Text style={styles.brand}>UniRide</Text>
                  <Text style={styles.subtitle}>Crea tu perfil de pasajero</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Tarjeta */}
            <View style={styles.card}>
              <Text style={styles.title}>Registro Pasajero</Text>

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
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color="#4B5563"
                  style={styles.icon}
                />
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
              <Pressable onPress={handleRegister} style={{ width: '100%' }} disabled={loading}>
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.button, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Creando cuenta...' : 'Registrarse'}
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
    shadowColor: '#2F6CF4',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
