import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext"; // ajusta ruta si es necesario

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
