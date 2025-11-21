import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// 👇 Ajusta la ruta según tu proyecto (tú lo tienes en src/context/AuthContext)
import { AuthContext } from '../contexts/AuthContext';

export default function PassengerProfile() {
  const { user } = useContext(AuthContext);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Pasajero UniRide';

  const email = user?.email ?? 'Sin correo registrado';
  const phone = user?.phone ?? 'Sin teléfono registrado';

  const subtitle =
    user?.rol === 'ambos'
      ? 'Pasajero y conductor UniRide'
      : 'Pasajero UniRide';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <LinearGradient
        colors={['#2F6CF4', '#00C2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Avatar genérico por ahora */}
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        {/* Rol */}
        <View style={styles.row}>
          <Ionicons name="person-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>
            Rol: {user?.rol ?? 'No definido'}
          </Text>
        </View>

        {/* Correo */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{email}</Text>
        </View>

        {/* Teléfono */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>{phone}</Text>
        </View>

        {/* Viajes realizados (mock por ahora) */}
        <View style={styles.row}>
          <Ionicons name="map-outline" size={22} color="#2F6CF4" />
          <Text style={styles.label}>32 viajes realizados</Text>
        </View>

        <Pressable style={styles.button}>
          <LinearGradient
            colors={['#2F6CF4', '#00C2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Text style={styles.buttonText}>Editar perfil</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerContent: { alignItems: 'center' },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
    marginTop: 40,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#E6F7FF', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  label: { fontSize: 16, color: '#111827', fontWeight: '500' },
  button: { marginTop: 10 },
  gradient: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
