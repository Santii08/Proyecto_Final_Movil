import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import UniRideLogo from "../../components/UniRideLogo";

/* ---------- TIPOS PARA GEMINI ---------- */
type GeminiCandidate = {
  content: { parts: { text: string }[] };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  // Por si viene un error estándar de Google
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

export default function SupportScreen() {
  const [reportText, setReportText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendReport = async () => {
    if (!reportText.trim()) {
      setError("Por favor escribe qué ocurrió antes de enviar el reporte.");
      setAiAnswer(null);
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("No se encontró la clave de Gemini. Revisa EXPO_PUBLIC_GEMINI_API_KEY.");
      setAiAnswer(null);
      return;
    }

    setIsSending(true);
    setError(null);
    setAiAnswer(null);

    const body = {
      contents: [
        {
          parts: [
            {
              text: `
Eres un agente de soporte de la app de viajes compartidos UniRide.

El usuario describe este problema:
"""${reportText.trim()}"""

Devuelve SOLO un JSON con este formato:
{
  "respuesta": "mensaje breve, empático y claro en español, máximo 4 líneas, explicando qué puede hacer el usuario o cómo lo ayudará el equipo de soporte"
}

No agregues nada fuera del JSON.
              `.trim(),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            respuesta: { type: "STRING" },
          },
          required: ["respuesta"],
        },
      },
    };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const json: GeminiResponse = await response.json();
      console.log("Gemini raw response:", JSON.stringify(json, null, 2));

      // Si la API devolvió un error
      if (json.error) {
        throw new Error(json.error.message || "Error en la API de Gemini");
      }

      const candidate = json.candidates?.[0];
      const partTexts =
        candidate?.content?.parts
          ?.map((p) => p.text)
          .filter(Boolean) ?? [];

      const text = partTexts.join("").trim();
      if (!text) {
        throw new Error("No se recibió texto de la IA");
      }

      // Por si viene con prefijo "json"
      const cleaned = text.replace(/^json\n?/i, "").trim();

      let respuesta: string;
      try {
        const parsed = JSON.parse(cleaned) as { respuesta?: string };
        if (!parsed.respuesta) {
          throw new Error("JSON sin campo 'respuesta'");
        }
        respuesta = parsed.respuesta;
      } catch {
        // Si no es JSON válido, al menos mostramos el texto que llegó
        respuesta = cleaned;
      }

      setAiAnswer(respuesta);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error inesperado al consultar la IA");
      setAiAnswer(null);
    } finally {
      setIsSending(false);
    }
  };

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
            value={reportText}
            onChangeText={setReportText}
          />

          <Pressable
            style={styles.submitButton}
            onPress={handleSendReport}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitText}>Enviando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitText}>Enviar reporte</Text>
                <Ionicons name="send-outline" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          {/* Mensaje de error */}
          {error && (
            <Text style={{ color: "#F97316", marginTop: 10 }}>
              {error}
            </Text>
          )}

          {/* Respuesta IA */}
          {aiAnswer && (
            <View style={[styles.aiCard, { marginTop: 18 }]}>
              <Text style={styles.aiTitle}>Respuesta rápida de UniRide IA</Text>
              <Text style={styles.aiText}>{aiAnswer}</Text>
            </View>
          )}
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

  aiCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  aiText: {
    fontSize: 14,
    color: "#4B5563",
  },
});
