// app/(main)/editPassengerProfile.tsx

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AuthContext } from '../contexts/AuthContext';

export default function EditPassengerProfile() {
  const router = useRouter();
  const { user, updateProfile } = useContext(AuthContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales del usuario
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setPlate(user.plate ?? '');
    }
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FB' }}>
        <Text>No hay usuario en sesión.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Campos obligatorios', 'Nombre, apellido y correo son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const ok = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        plate: plate.trim().toUpperCase(),
      });

      if (ok) {
        Alert.alert('Perfil actualizado', 'Tus datos se han guardado correctamente.', [
          {
            text: 'OK',
            onPress: () => router.back(), // vuelve al perfil
          },
        ]);
      } else {
        Alert.alert('Error', 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('❌ Error al actualizar perfil:', err);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F7FB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#2F6CF4', '#00C2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <Text style={styles.headerSubtitle}>Actualiza tu información personal</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Nombre */}
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#4B5563" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* Apellido */}
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#4B5563" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            placeholderTextColor="#9CA3AF"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* Correo */}
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color="#4B5563" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Teléfono */}
        <View style={styles.inputRow}>
          <Ionicons name="call-outline" size={20} color="#4B5563" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Placa (opcional) */}
        <View style={styles.inputRow}>
          <Ionicons name="card-outline" size={20} color="#4B5563" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Placa (si aplica)"
            placeholderTextColor="#9CA3AF"
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
          />
        </View>

        {/* Rol solo lectura */}
        <View style={[styles.inputRow, { backgroundColor: '#F3F4F6' }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4B5563" style={styles.icon} />
          <Text style={{ color: '#4B5563' }}>
            Rol actual: <Text style={{ fontWeight: '700' }}>{user.rol}</Text>
          </Text>
        </View>

        {/* Botón guardar */}
        <Pressable onPress={handleSave} disabled={loading} style={{ width: '100%', marginTop: 10 }}>
          <LinearGradient
            colors={['#2F6CF4', '#00C2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          >
            <Text style={styles.saveText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#E6F7FF',
    fontSize: 13,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 50,
    width: '100%',
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#2F6CF4',
    shadowOpacity: Platform.select({ ios: 0.25, android: 0.35 }) as number,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
