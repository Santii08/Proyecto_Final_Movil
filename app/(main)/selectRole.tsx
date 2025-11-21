import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const SelectRoleScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Si por alguna razón no hay usuario en contexto, lo mandamos al login
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const firstName = user.firstName || 'UniRider';

  const handlePassenger = () => {
    router.replace('/(main)/indexPassanger');
  };

  const handleDriver = () => {
    router.replace('/(main)/indexDriver');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <LinearGradient
        colors={['#2F6CF4', '#00C2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="repeat-outline" size={40} color="#fff" />
          <Text style={styles.title}>
            Hola {firstName}, ¿hoy vas a conducir o irás en UniRide?
          </Text>
          <Text style={styles.subtitle}>
            Elige cómo quieres usar la app en este momento.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Pressable style={styles.option} onPress={handlePassenger}>
          <View style={styles.optionIcon}>
            <Ionicons name="person-outline" size={26} color="#2F6CF4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Ir como pasajero</Text>
            <Text style={styles.optionText}>
              Ver viajes disponibles, reservar cupos y seguir tu trayecto.
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.option} onPress={handleDriver}>
          <View style={styles.optionIconDriver}>
            <Ionicons name="car-sport-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Conducir</Text>
            <Text style={styles.optionText}>
              Publicar trayectos, gestionar tus pasajeros y tus viajes.
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default SelectRoleScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#E6F7FF',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderRadius: 14,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDriver: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2F6CF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  optionText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
