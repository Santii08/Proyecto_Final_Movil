// app/contexts/AuthContext.tsx

import { createContext, ReactNode, useState } from 'react';
import { User } from '../types/common.type';
import { supabase } from '../utils/supabase';

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (user: User, password: string) => Promise<User | null>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * LOGIN
   * Devuelve el User completo o null
   */
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('❌ Login error:', error?.message);
        return null;
      }

      // 1️⃣ Intentar traer fila de "usuarios"
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let finalUser: User;

      if (profileError || !profileData) {
        console.warn('⚠️ No se encontró fila en "usuarios":', profileError?.message);

        // 2️⃣ Si no hay fila en usuarios, usamos datos de auth.user
        finalUser = {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName: data.user.user_metadata?.first_name ?? '',
          lastName: data.user.user_metadata?.last_name ?? '',
          phone: data.user.user_metadata?.phone ?? null,
          plate: data.user.user_metadata?.plate ?? null,
          rol: (data.user.user_metadata?.rol as User['rol']) ?? 'pasajero',
        };
      } else {
        // 3️⃣ Usar fila de "usuarios"
        finalUser = {
          id: profileData.id,
          email: profileData.email,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          phone: profileData.phone,
          plate: profileData.plate,
          rol: profileData.rol,
        };
      }

      // 🔥 Guardar en el contexto
      setUser(finalUser);

      return finalUser;
    } catch (err: any) {
      console.error('❌ Login exception:', err.message);
      return null;
    }
  };

  /**
   * REGISTER
   * Crea usuario en auth + tabla usuarios y devuelve el User
   */
  const register = async (newUser: User, password: string): Promise<User | null> => {
    try {
      // 1️⃣ Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            phone: newUser.phone ?? '',
            plate: newUser.plate ?? '',
            rol: newUser.rol,
          },
        },
      });

      if (error || !data.user) {
        console.error('❌ Registration error:', error?.message);
        return null;
      }

      // 2️⃣ Insertar fila en "usuarios"
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: data.user.id,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        phone: newUser.phone ?? '',
        plate: newUser.plate ?? '',
        rol: newUser.rol,
      });

      if (profileError) {
        console.error('❌ Error creando usuario en tabla usuarios:', profileError.message);
        return null;
      }

      const finalUser: User = {
        id: data.user.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone ?? '',
        plate: newUser.plate ?? null,
        rol: newUser.rol,
      };

      setUser(finalUser);
      return finalUser;
    } catch (err: any) {
      console.error('❌ Register exception:', err.message);
      return null;
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
      const updateRow: any = {};

      if (profileData.firstName !== undefined) {
        updateRow.first_name = profileData.firstName.trim();
      }
      if (profileData.lastName !== undefined) {
        updateRow.last_name = profileData.lastName.trim();
      }
      if (profileData.phone !== undefined) {
        updateRow.phone = profileData.phone ? profileData.phone.trim() : null;
      }
      if (profileData.plate !== undefined) {
        updateRow.plate = profileData.plate ? profileData.plate.trim().toUpperCase() : null;
      }
      if (profileData.rol !== undefined) {
        updateRow.rol = profileData.rol;
      }
      if (profileData.email !== undefined) {
        updateRow.email = profileData.email.trim().toLowerCase();
      }

      // 1️⃣ SI CAMBIA EL EMAIL → actualizar Supabase Auth
      if (
        profileData.email &&
        profileData.email.trim().toLowerCase() !== user.email
      ) {
        const { error: authError } = await supabase.auth.updateUser({
          email: profileData.email.trim().toLowerCase(),
        });

        if (authError) {
          console.error("❌ Error updating auth email:", authError.message);
          return false;
        }
      }

      // 2️⃣ UPDATE en tabla usuarios
      const { error } = await supabase
        .from("usuarios")
        .update({
          ...updateRow,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Update profile error:", error.message);
        return false;
      }

      // 3️⃣ ACTUALIZAR ESTADO LOCAL
      setUser({
        ...user,
        email: updateRow.email ?? user.email,
        firstName: updateRow.first_name ?? user.firstName,
        lastName: updateRow.last_name ?? user.lastName,
        phone: updateRow.phone ?? user.phone,
        plate: updateRow.plate ?? user.plate,
        rol: updateRow.rol ?? user.rol,
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
