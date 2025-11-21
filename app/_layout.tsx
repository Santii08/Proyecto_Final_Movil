// app/_layout.tsx

import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "./contexts/AuthContext"; // 👈 IMPORTANTE

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
