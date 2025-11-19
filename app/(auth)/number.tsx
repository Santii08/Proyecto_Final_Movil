import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function PhoneNumber() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'driver' | 'passenger' | null>(null);

  const handleNext = () => {
    if (!role) {
      alert('Por favor selecciona tu rol.');
      return;
    }
    if (!phone) {
      alert('Ingresa tu número de teléfono.');
      return;
    }

    if (role === 'passenger') {
      router.push({
        pathname: '/registerPassenger',
        params: { phone, role: 'passenger' },
      });
    } else {
      router.push({
        pathname: '/registerDriver',
        params: { phone, role: 'driver' },
      });
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Regístrate con tu número</Text>

      {/* Input del número */}
      <View style={styles.inputContainer}>
        <View style={styles.flagContainer}>
          <Image
            source={{ uri: 'https://flagcdn.com/w40/co.png' }}
            style={styles.flag}
          />
          <Text style={styles.countryCode}>+57</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="81234 56789"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      {/* Selección de rol */}
      <Text style={styles.subTitle}>¿Qué tipo de usuario eres?</Text>

      <View style={styles.roleContainer}>
        <Pressable
          style={[styles.roleBtn, role === 'passenger' && styles.selectedRole]}
          onPress={() => setRole('passenger')}
        >
          <Ionicons name="person-outline" size={22} color={role === 'passenger' ? '#fff' : '#007BFF'} />
          <Text style={[styles.roleText, role === 'passenger' && styles.roleTextSelected]}>
            Pasajero
          </Text>
        </Pressable>

        <Pressable
          style={[styles.roleBtn, role === 'driver' && styles.selectedRole]}
          onPress={() => setRole('driver')}
        >
          <Ionicons name="car-sport-outline" size={22} color={role === 'driver' ? '#fff' : '#007BFF'} />
          <Text style={[styles.roleText, role === 'driver' && styles.roleTextSelected]}>
            Conductor
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/login')}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 30,
    color: '#111',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '100%',
    marginBottom: 20,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  flag: {
    width: 30,
    height: 20,
    borderRadius: 3,
    marginRight: 5,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  selectedRole: {
    backgroundColor: '#007BFF',
  },
  roleText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    color: '#007BFF',
    fontSize: 16,
  },
});
