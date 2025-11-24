import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from '../utils/supabase';

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
  driver_id: string;
};

const colors = [
  "#EF4444", // rojo
  "#F97316", // naranja
  "#EAB308", // amarillo
  "#22C55E", // verde
  "#0EA5E9", // azul
  "#6366F1", // morado
  "#EC4899", // rosado
  "#000000", // negro
  "#6B7280", // gris
  "#FFFFFF", // blanco
];

export default function VehicleManager() {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  /* ====================================
        FETCH VEHICLES DEL CONDUCTOR
  =====================================*/
  const fetchVehicles = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("vehiculos")
      .select("*")
      .eq("driver_id", user.id);

    if (error) {
      console.log("❌ Error trayendo vehículos:", error.message);
    } else {
      setVehicles(data as Vehicle[]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const resetForm = () => {
    setBrand('');
    setModel('');
    setYear('');
    setPlate('');
    setColor('');
    setEditId(null);
  };

  /* ====================================
               SAVE VEHICLE
  =====================================*/
  const handleSave = async () => {
    if (!brand || !model || !year || !plate || !color) {
      Alert.alert("Faltan datos", "Completa todos los campos.");
      return;
    }

    if (!user) return;

    if (editId) {
      // EDITAR
      const { error } = await supabase
        .from("vehiculos")
        .update({ brand, model, year, plate, color })
        .eq("id", editId);

      if (error) return Alert.alert("Error", error.message);

      Alert.alert("Vehículo actualizado");
    } else {
      // AGREGAR
      const { error } = await supabase.from("vehiculos").insert({
        brand,
        model,
        year,
        plate,
        color,
        driver_id: user.id,
      });

      if (error) return Alert.alert("Error", error.message);

      Alert.alert("Vehículo agregado");
    }

    resetForm();
    setModalVisible(false);
    fetchVehicles();
  };

  /* ====================================
               DELETE
  =====================================*/
  const handleDelete = (id: string) => {
    Alert.alert("Eliminar vehículo", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("vehiculos")
            .delete()
            .eq("id", id);

          if (error) return Alert.alert("Error", error.message);

          fetchVehicles();
        }
      }
    ]);
  };

  /* ====================================
               EDIT MODAL
  =====================================*/
  const openEditModal = (v: Vehicle) => {
    setBrand(v.brand);
    setModel(v.model);
    setYear(v.year);
    setPlate(v.plate);
    setColor(v.color);
    setEditId(v.id);
    setModalVisible(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F7FB" }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <LinearGradient
          colors={["#2F6CF4", "#00C2FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: 18 + insets.top }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", left: 20, top: insets.top + 18 }}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>

          <Text style={styles.brand}>UniRide</Text>
          <Text style={styles.subtitle}>Gestión de vehículos</Text>
        </LinearGradient>

        {/* VEHICLE LIST */}
        <View style={styles.card}>
          <Text style={styles.title}>Mis vehículos</Text>

          {vehicles.map(v => (
            <View key={v.id} style={styles.vehicleItem}>
              <View style={[styles.vehicleIcon, { backgroundColor: v.color }]}>
                <Ionicons name="car-sport-outline" size={26} color="#fff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {v.brand} {v.model} ({v.year})
                </Text>
                <Text style={styles.vehiclePlate}>Placa: {v.plate}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={() => openEditModal(v)}>
                  <Ionicons name="create-outline" size={20} color="#2563EB" />
                </Pressable>

                <Pressable onPress={() => handleDelete(v.id)}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))}

          {/* ADD BUTTON */}
          <Pressable onPress={() => setModalVisible(true)} style={{ marginTop: 20 }}>
            <LinearGradient colors={["#2F6CF4", "#00C2FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}style={styles.addButton}>
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Añadir vehículo</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>
                {editId ? "Editar vehículo" : "Nuevo vehículo"}
              </Text>

              <TextInput style={styles.input} placeholder="Marca" value={brand} onChangeText={setBrand} />
              <TextInput style={styles.input} placeholder="Modelo" value={model} onChangeText={setModel} />
              <TextInput style={styles.input} placeholder="Año" keyboardType="numeric" value={year} onChangeText={setYear} />
              <TextInput style={styles.input} placeholder="Placa" autoCapitalize="characters" value={plate} onChangeText={setPlate} />

              {/* COLOR SELECTOR */}
              <Text style={styles.colorLabel}>Color del vehículo:</Text>
              <View style={styles.colorGrid}>
                {colors.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c, borderWidth: color === c ? 3 : 1 }
                    ]}
                  />
                ))}
              </View>

              <Pressable onPress={handleSave} style={{ width: "100%", marginTop: 16 }}>
                <LinearGradient colors={["#2F6CF4", "#00C2FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}  style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Guardar</Text>
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
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  header: {
    width: '100%',
    height: 160,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
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
    marginTop: 20,
    marginBottom: 20,
    fontWeight: '600',
  },
  colorLabel: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: "#444",
  },
});
