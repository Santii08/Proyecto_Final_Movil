import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

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
                colors={['#ffffff55', '#ffffff10']}
                style={[styles.bubble, { width: 160, height: 160, borderRadius: 80, top: -30, right: -40 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                colors={['#ffffff55', '#ffffff10']}
                style={[styles.bubble, { width: 120, height: 120, borderRadius: 60, bottom: -20, left: -20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="key-outline" size={26} color="#2F6CF4" />
                </View>
                <View>
                  <Text style={styles.brand}>UniRide</Text>
                  <Text style={styles.subtitle}>Recupera el acceso a tu cuenta</Text>
                </View>
              </View>
            </LinearGradient>

            {/* TARJETA */}
            <View style={styles.card}>
              <Text style={styles.title}>Recuperar contraseña</Text>
              <Text style={styles.description}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </Text>

              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Pressable onPress={() => console.log('Enviar enlace')} style={{ width: '100%' }}>
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryText}>Enviar enlace</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/login')} style={{ marginTop: 16 }}>
                <Text style={styles.back}>
                  <Ionicons name="arrow-back-outline" size={16} color="#2F6CF4" /> Volver al inicio de sesión
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 38,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#2F6CF4',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
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
  brand: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { color: '#E6F7FF', fontSize: 13, marginTop: 2 },

  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 50,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  description: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
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
    marginBottom: 18,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },

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
  back: {
    color: '#2F6CF4',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
