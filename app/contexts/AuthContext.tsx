// src/context/AuthContext.tsx

import { createContext, ReactNode, useState } from "react";
import { User } from "../types/common.type";
import { supabase } from "../utils/supabase";

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: User, password: string) => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * LOGIN
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login error:", error.message);
        return false;
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profileData) {
          console.error("⚠️ No se encontró fila en 'usuarios':", profileError?.message);

          setUser({
            id: data.user.id,
            email: data.user.email!,
            firstName: data.user.user_metadata?.first_name || "",
            lastName: data.user.user_metadata?.last_name || "",
            phone: data.user.user_metadata?.phone ?? null,
            plate: data.user.user_metadata?.plate ?? null,
            rol: (data.user.user_metadata?.rol as User["rol"]) || "pasajero",
          });
        } else {
          setUser({
            id: profileData.id,
            email: profileData.email,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            phone: profileData.phone,
            plate: profileData.plate, // 👈 aquí leemos la placa
            rol: profileData.rol,
          });
        }

        return true;
      }

      return false;
    } catch (err: any) {
      console.error("❌ Login exception:", err.message);
      return false;
    }
  };

  /**
   * REGISTER
   * newUser trae todos los campos: email, firstName, lastName, phone, plate?, rol
   */
  const register = async (newUser: User, password: string): Promise<boolean> => {
    try {
      // 1️⃣ Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            phone: newUser.phone ?? "",
            plate: newUser.plate ?? "", // 👈 placa
            rol: newUser.rol,
          },
        },
      });

      if (error) {
        console.error("❌ Registration error:", error.message);
        return false;
      }

      if (data.user) {
        // 2️⃣ Insertar fila en tabla "usuarios"
        const { error: profileError } = await supabase.from("usuarios").insert({
          id: data.user.id,
          email: newUser.email,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          phone: newUser.phone ?? "",
          plate: newUser.plate ?? "", // 👈 placa guardada aquí
          rol: newUser.rol,
        });

        if (profileError) {
          console.error("❌ Error creando usuario:", profileError.message);
          return false;
        }

        // 3️⃣ Guardar en el estado global
        setUser({
          id: data.user.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone ?? "",
          plate: newUser.plate ?? null,
          rol: newUser.rol,
        });

        return true;
      }

      return false;
    } catch (err: any) {
      console.error("❌ Register exception:", err.message);
      return false;
    }
  };

  /**
   * UPDATE PROFILE
   */
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    if (!user?.id) {
      console.error("⚠️ No user ID available");
      return false;
    }

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          email: profileData.email ?? user.email,
          first_name: profileData.firstName ?? user.firstName,
          last_name: profileData.lastName ?? user.lastName,
          phone: profileData.phone ?? user.phone,
          plate: profileData.plate ?? user.plate, // 👈 actualizar placa
          rol: profileData.rol ?? user.rol,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Update profile error:", error.message);
        return false;
      }

      setUser({
        ...user,
        ...profileData,
      });

      return true;
    } catch (err: any) {
      console.error("❌ Update profile exception:", err.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
