import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function UniRideLogo() {
  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.20)", "rgba(255,255,255,0.06)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.box}
    >
      {/* Row principal con 3 columnas:
          - izquierda: flechas (pero no empujan texto)
          - centro: UniRide centrado
          - derecha: placeholder invisible para balancear */}
      <View style={styles.row}>
        
        {/* Columna izquierda: flechas */}
        <View style={styles.leftCol}>
          <View style={[styles.arrowRow]}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <View style={styles.line} />
          </View>

          <View style={styles.arrowRow}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <View style={[styles.line, { width: 18 }]} />
          </View>

          <View style={styles.arrowRow}>
            <Ionicons name="arrow-back" size={14} color="#fff" />
            <View style={[styles.line, { width: 14 }]} />
          </View>
        </View>

        {/* Columna central: texto perfectamente centrado */}
        <View style={styles.centerCol}>
          <Text style={styles.logo}>UniRide</Text>
        </View>

        {/* Columna derecha invisible: balance del layout */}
        <View style={styles.rightCol} />
      </View>

      {/* Eslogan */}
      <Text style={styles.slogan}>Move with safety</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 260,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
  },

  /* ROW PRINCIPAL */
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* COLUMNA IZQUIERDA (flechas) */
  leftCol: {
    width: 55, // evita mover el texto
    justifyContent: "center",
    alignItems: "flex-end",
  },

  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  line: {
    height: 1.3,
    width: 22,
    backgroundColor: "#fff",
    marginLeft: -4, // punta de flecha toca línea
    opacity: 1,
    borderRadius: 40,
  },

  /* COLUMNA CENTRAL (texto centrado REAL) */
  centerCol: {
    flex: 1,
    alignItems: "center",
  },

  logo: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "800",
  },

  /* COLUMNA DERECHA INVISIBLE (balance) */
  rightCol: {
    width: 55,
  },

  slogan: {
    marginTop: 8,
    color: "#E5ECFF",
    fontSize: 10,
    opacity: 0.9,
  },
});
