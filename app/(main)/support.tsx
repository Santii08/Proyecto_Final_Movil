import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import UniRideLogo from "../../components/UniRideLogo";

export default function SupportScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient
          colors={["#2F6CF4", "#7C5BFA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>

          <Text style={styles.title}>Soporte UniRide</Text>

          <View style={{ alignItems: "center", marginTop: 12 }}>
            <UniRideLogo />
          </View>
        </LinearGradient>

        {/* OPCIONES PRINCIPALES */}
        <View style={styles.section}>
          <SupportCard
            icon="car-outline"
            title="Problema con un viaje"
            subtitle="Cobro, ruta, conductor, etc."
          />
          <SupportCard
            icon="shield-checkmark-outline"
            title="Seguridad y confianza"
            subtitle="Reportar comportamiento o situación de riesgo"
          />

          <SupportCard
            icon="help-circle-outline"
            title="Centro de ayuda"
            subtitle="Preguntas frecuentes de la app"
          />
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <FAQCard text="¿Qué pasa si el conductor cancela el viaje?" />
          <FAQCard text="¿Cómo reporto un problema de seguridad?" />
          <FAQCard text="¿Cómo se calculan los costos del viaje?" />
        </View>

        {/* FORMULARIO */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Cuéntanos qué ocurrió</Text>
          <Text style={styles.formDesc}>
            Nuestro equipo revisará tu caso y te responderá por correo o
            WhatsApp.
          </Text>

          <TextInput
            placeholder="Ej: El conductor no llegó al punto de encuentro..."
            placeholderTextColor="#9CA3AF"
            style={styles.textArea}
            multiline
            numberOfLines={5}
          />

          <Pressable style={styles.submitButton}>
            <Text style={styles.submitText}>Enviar reporte</Text>
            <Ionicons name="send-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================
    COMPONENTE: SupportCard
============================================ */
type SupportCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

function SupportCard({ icon, title, subtitle }: SupportCardProps) {
  return (
    <Pressable style={styles.card}>
      <Ionicons name={icon} size={26} color="#2F6CF4" />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
    </Pressable>
  );
}

/* ============================================
    COMPONENTE: FAQCard
============================================ */
type FAQCardProps = {
  text: string;
};

function FAQCard({ text }: FAQCardProps) {
  return (
    <Pressable style={styles.faq}>
      <Text style={styles.faqText}>{text}</Text>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </Pressable>
  );
}

/* ============================================
    STYLES
============================================ */
const styles = StyleSheet.create({
  header: {
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },

  cardSubtitle: {
    marginTop: 2,
    color: "#64748B",
  },

  faq: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  faqText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },

  formSection: {
    marginTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  formTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "700",
  },

  formDesc: {
    color: "#94A3B8",
    marginTop: 6,
    marginBottom: 12,
  },

  textArea: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    height: 120,
    textAlignVertical: "top",
  },

  submitButton: {
    marginTop: 18,
    backgroundColor: "#2F6CF4",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
