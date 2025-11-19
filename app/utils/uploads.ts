import { supabase } from "../utils/supabase";

export async function uploadImage(fileUri: string, folder: string, userId: string) {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const fileExt = fileUri.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(folder) // 👈 nombre del bucket (ej: "posts")
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(folder).getPublicUrl(filePath);

    return data.publicUrl; // 👉 devuelve la URL lista para guardar
  } catch (err: any) {
    console.error("❌ Error subiendo imagen:", err.message);
    return null;
  }
}
