// app/contexts/AuthContext.tsx

import { createContext, ReactNode, useState } from "react";
import { User } from "../types/common.type";
import { supabase } from "../utils/supabase";

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (user: User, password: string) => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * LOGIN – Devuelve un User real (no booleano)
   */
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error("❌ Login error:", error?.message);
        return null;
      }

      const authUser = data.user;

      // Traer fila de usuarios
      const { data: profileData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authUser.id)
        .single();

      const finalUser: User = {
        id: authUser.id,
        email: authUser.email!,
        firstName: profileData?.first_name ?? authUser.user_metadata?.first_name ?? "",
        lastName: profileData?.last_name ?? authUser.user_metadata?.last_name ?? "",
        phone: profileData?.phone ?? authUser.user_metadata?.phone ?? null,
        plate: profileData?.plate ?? authUser.user_metadata?.plate ?? null,
        rol: profileData?.rol ?? authUser.user_metadata?.rol ?? "pasajero",
      };

      setUser(finalUser);
      return finalUser;
    } catch (err: any) {
      console.error("❌ Login exception:", err.message);
      return null;
    }
  };

  /**
   * REGISTER (igual que antes)
   */
  const register = async (newUser: User, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            phone: newUser.phone ?? "",
            plate: newUser.plate ?? "",
            rol: newUser.rol,
          },
        },
      });

      if (error || !data.user) return false;

      const { error: profileError } = await supabase.from("usuarios").insert({
        id: data.user.id,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        phone: newUser.phone ?? "",
        plate: newUser.plate ?? "",
        rol: newUser.rol,
      });

      if (profileError) return false;

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
    } catch (err: any) {
      console.error("❌ Register exception:", err.message);
      return false;
    }
  };

  /**
   * UPDATE PROFILE
   */
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          email: profileData.email ?? user.email,
          first_name: profileData.firstName ?? user.firstName,
          last_name: profileData.lastName ?? user.lastName,
          phone: profileData.phone ?? user.phone,
          plate: profileData.plate ?? user.plate,
          rol: profileData.rol ?? user.rol,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) return false;

      setUser({ ...user, ...profileData });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, updateProfile, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
