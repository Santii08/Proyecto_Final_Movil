import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
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

/* ---------- TYPES ---------- */
type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
};

/* ---------- COMPONENT ---------- */
const VehicleManager: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', brand: 'Toyota', model: 'Corolla', year: '2018', plate: 'ABC123' },
  ]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => {
    setBrand('');
    setModel('');
    setYear('');
    setPlate('');
    setEditId(null);
  };

  const handleAddVehicle = () => {
    if (!brand || !model || !year || !plate) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    if (editId) {
      // Editar vehículo existente
      setVehicles(prev =>
        prev.map(v =>
          v.id === editId ? { ...v, brand, model, year, plate } : v
        )
      );
      Alert.alert('Vehículo actualizado');
    } else {
      // Agregar nuevo vehículo
      const newVehicle: Vehicle = {
        id: Math.random().toString(36).substring(2, 10),
        brand,
        model,
        year,
        plate,
      };
      setVehicles(prev => [...prev, newVehicle]);
      Alert.alert('Vehículo agregado');
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDeleteVehicle = (id: string) => {
    Alert.alert('Eliminar vehículo', '¿Estás seguro de eliminar este vehículo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setVehicles(prev => prev.filter(v => v.id !== id)),
      },
    ]);
  };

  const handleEditVehicle = (v: Vehicle) => {
    setBrand(v.brand);
    setModel(v.model);
    setYear(v.year);
    setPlate(v.plate);
    setEditId(v.id);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <LinearGradient
          colors={['#2F6CF4', '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.brand}>UniRide</Text>
            <Text style={styles.subtitle}>Gestión de vehículos</Text>
          </View>
        </LinearGradient>

        {/* VEHICLES CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>Mis vehículos</Text>

          {vehicles.map(v => (
            <View key={v.id} style={styles.vehicleItem}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport-outline" size={24} color="#2F6CF4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {v.brand} {v.model} ({v.year})
                </Text>
                <Text style={styles.vehiclePlate}>Placa: {v.plate}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => handleEditVehicle(v)}>
                  <Ionicons name="create-outline" size={20} color="#2563EB" />
                </Pressable>
                <Pressable onPress={() => handleDeleteVehicle(v.id)}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))}

          {vehicles.length === 0 && (
            <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 10 }}>
              No tienes vehículos registrados.
            </Text>
          )}

          {/* Botón agregar */}
          <Pressable onPress={() => setModalVisible(true)} style={{ marginTop: 20 }}>
            <LinearGradient
              colors={['#2F6CF4', '#00C2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={styles.addButtonText}>
                {vehicles.length === 0 ? 'Agregar vehículo' : 'Añadir otro vehículo'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>
                {editId ? 'Editar vehículo' : 'Nuevo vehículo'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Marca (ej. Toyota)"
                placeholderTextColor="#6B7280"
                value={brand}
                onChangeText={setBrand}
              />
              <TextInput
                style={styles.input}
                placeholder="Modelo (ej. Corolla)"
                placeholderTextColor="#6B7280"
                value={model}
                onChangeText={setModel}
              />
              <TextInput
                style={styles.input}
                placeholder="Año (ej. 2020)"
                placeholderTextColor="#6B7280"
                value={year}
                keyboardType="numeric"
                onChangeText={setYear}
              />
              <TextInput
                style={styles.input}
                placeholder="Placa (ej. ABC123)"
                placeholderTextColor="#6B7280"
                autoCapitalize="characters"
                value={plate}
                onChangeText={setPlate}
              />

              <Pressable onPress={handleAddVehicle} style={{ width: '100%', marginTop: 12 }}>
                <LinearGradient
                  colors={['#2F6CF4', '#00C2FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>
                    {editId ? 'Guardar cambios' : 'Agregar vehículo'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => { resetForm(); setModalVisible(false); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default VehicleManager;

/* ---------- STYLES ---------- */
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
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleName: { fontWeight: '700', color: '#111827', fontSize: 16 },
  vehiclePlate: { color: '#6B7280', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginLeft: 8 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '600',
  },
});
