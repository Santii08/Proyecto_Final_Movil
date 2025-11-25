import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

export async function uploadProfileAvatar(
  userId: string,
  uri: string,
  role: "driver" | "passenger"
): Promise<string> {
  // Leer como base64 usando la API legacy
  const fileBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  const fileName = `${userId}-${role}-${Date.now()}.jpg`;
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, Buffer.from(fileBase64, "base64"), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("❌ Error subiendo avatar:", error.message);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(filePath);

  return publicUrl;
}

export const uploadDriverAvatar = (userId: string, uri: string) =>
  uploadProfileAvatar(userId, uri, "driver");

export const uploadPassengerAvatar = (userId: string, uri: string) =>
  uploadProfileAvatar(userId, uri, "passenger");
