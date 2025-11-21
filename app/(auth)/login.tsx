// app/(auth)/login.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
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

import { AuthContext } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      console.log('Login pressed');

      // 👇 login debe devolver User | null en tu AuthContext
      const loggedUser = await login(email.trim().toLowerCase(), password);

      if (!loggedUser) {
        setErrorMsg('Correo o contraseña incorrectos.');
        return;
      }

      console.log('ROL:', loggedUser.rol);

      if (loggedUser.rol === 'pasajero') {
        router.replace('/(main)/indexPassanger');
      } else if (loggedUser.rol === 'conductor') {
        router.replace('/(main)/indexDriver');
      } else {
        // rol = 'ambos'
        router.replace('/(main)/indexPassanger'); // ajusta a como se llame tu archivo
      }
    } catch (e) {
      console.error('❌ Error en handleLogin:', e);
      setErrorMsg('Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {/* HEADER CURVO */}
            <LinearGradient
              colors={['#2F6CF4', '#00C2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              {/* Burbujas decorativas */}
              <LinearGradient
                colors={['#ffffff66', '#ffffff10']}
                style={[
                  styles.bubble,
                  {
                    width: 180,
                    height: 180,
                    borderRadius: 90,
                    top: -40,
                    right: -40,
                  },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                colors={['#ffffff55', '#ffffff10']}
                style={[
                  styles.bubble,
                  {
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    bottom: -30,
                    left: -20,
                  },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="car-sport" size={28} color="#2F6CF4" />
                </View>
                <View>
                  <Text style={styles.brand}>UniRide</Text>
                  <Text style={styles.subtitle}>
                    Tu viaje, más fácil y seguro
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* TARJETA (SOLAPADA Y CENTRADA) */}
            <View style={styles.card}>
              <Text style={styles.title}>Iniciar sesión</Text>

              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                />
                <Pressable
                  style={styles.eyeBtn}
                  hitSlop={10}
                  onPress={() => setSecure(v => !v)}
                >
                  <Ionicons
                    name={secure ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>

              {errorMsg && (
                <Text
                  style={{
                    color: '#DC2626',
                    fontSize: 13,
                    alignSelf: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  {errorMsg}
                </Text>
              )}

              <Pressable onPress={() => router.push('/(auth)/recover')}>
                <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>

              <Pressable
                onPress={handleLogin}
                style={{ width: '100%' }}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.primaryText}>
                    {loading ? 'Ingresando...' : 'Entrar'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.divider} />
              </View>

              <Pressable style={styles.socialBtn}>
                <Ionicons name="logo-google" size={20} color="#111827" />
                <Text style={styles.socialText}>Continuar con Google</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/number')}
                style={{ marginTop: 16 }}
              >
                <Text style={styles.register}>
                  ¿Nuevo por aquí?{' '}
                  <Text style={styles.registerStrong}>Crear cuenta</Text>
                </Text>
              </Pressable>
            </View>

            <Text style={styles.legal}>
              Al continuar aceptas nuestros{' '}
              <Text style={styles.link}>Términos</Text> y la{' '}
              <Text style={styles.link}>Política de Privacidad</Text>.
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  /* HEADER */
  header: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#2F6CF4',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 0,
  },
  bubble: {
    position: 'absolute',
    opacity: 0.9,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  logoBadge: {
    backgroundColor: '#FFFFFF',
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
  brand: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: { color: '#E6F7FF', fontSize: 13, marginTop: 2 },

  /* CARD */
  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 50,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  eyeBtn: { padding: 6 },

  forgot: {
    alignSelf: 'flex-end',
    color: '#2F6CF4',
    fontSize: 13,
    marginBottom: 15,
  },

  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#2F6CF4',
    shadowOpacity: Platform.select({ ios: 0.25, android: 0.35 }),
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
    width: '100%',
  },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#6B7280', fontSize: 13 },

  socialBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  socialText: { color: '#111827', fontSize: 15, fontWeight: '600' },

  register: { textAlign: 'center', color: '#6B7280', fontSize: 14 },
  registerStrong: { color: '#2F6CF4', fontWeight: '700' },

  legal: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 18,
    paddingHorizontal: 24,
  },
  link: { color: '#2F6CF4', fontWeight: '600' },
});
