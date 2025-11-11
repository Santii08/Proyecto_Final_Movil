import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#2F6CF4', '#5A57F0', '#7B55E7']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* Contenedor centrado para el logo */}
      <View style={styles.logoWrapper}>
        {/* Flechas (ancladas al borde izquierdo del cuadro) */}
        <View style={styles.arrowsContainer} pointerEvents="none">
          {/* 1 */}
          <View style={[styles.arrowLine, { width: 60 }]}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <View style={[styles.line, styles.lineTouch]} />
          </View>
          {/* 2 */}
          <View style={[styles.arrowLine, { width: 50 }]}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <View style={[styles.line, styles.lineTouch]} />
          </View>
          {/* 3 */}
          <View style={[styles.arrowLine, { width: 40 }]}>
            <Ionicons name="arrow-back" size={14} color="#fff" />
            <View style={[styles.line, styles.lineTouch]} />
          </View>
        </View>

        {/* Cuadro UniRide */}
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoText}>UniRide</Text>
        </LinearGradient>
      </View>

      {/* Botón del medio */}
      <Pressable style={({ pressed }) => [
        styles.middleButton,
        pressed && { opacity: 0.7 }
      ]}>
        <Text style={styles.middleButtonText}>Move with safety</Text>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={20}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      {/* Botón inferior */}
      <Pressable
        style={({ pressed }) => [styles.startWrap, pressed && { transform: [{ translateY: 1 }] }]}
        onPress={() => router.push('/(auth)/number')}
      >
        <LinearGradient
          colors={['#4FB3F6', '#6B5CF0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButton}
        >
          <Text style={styles.startText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const BOX_WIDTH = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Contenedor del logo centrado ---
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    position: 'relative',
  },

  // Flechas posicionadas con respecto al cuadro (tocando su borde izquierdo)
  arrowsContainer: {
    position: 'absolute',
    right: BOX_WIDTH, // 🔑 coincide con borde izquierdo del cuadro
    top: '50%',
    transform: [{ translateY: -36 }],
    alignItems: 'flex-end',
  },

  // Cada fila: flecha primero, línea después (más corta)
  arrowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },

  // Línea blanca más corta
  line: {
    width: 30, // 🔹 líneas más cortas
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },

  // Unir línea con la flecha
  lineTouch: {
    marginLeft: -2,
  },

  // --- Recuadro UniRide ---
  logoBox: {
    width: BOX_WIDTH,
    paddingVertical: 26,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 10,
  },

  logoText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // --- Botón medio ---
  middleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 120,
    backgroundColor: 'transparent',
  },

  middleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // --- Botón inferior ---
  startWrap: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 8,
  },

  startButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  startText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
