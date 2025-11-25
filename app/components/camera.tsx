import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CameraComponent({
  onCapture,
  onCancel,
}: {
  onCapture: (uri: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [taking, setTaking] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 20 }}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setTaking(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      onCapture(photo.uri);
    } catch (e) {
      console.log("Error tomando foto:", e);
    } finally {
      setTaking(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        ref={cameraRef}
        facing="back" // o "back"
      />

      {/* Botones */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.capture} onPress={takePhoto}>
          {taking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.captureText}>Tomar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: "#1DA1F2",
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  capture: {
    backgroundColor: "#1DA1F2",
    padding: 16,
    borderRadius: 50,
    width: 100,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  captureText: { color: "#fff", fontWeight: "bold" },
  cancel: {
    padding: 12,
    backgroundColor: "gray",
    borderRadius: 8,
  },
  cancelText: { color: "white" },
});
