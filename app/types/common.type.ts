export type RolUsuario = "conductor" | "pasajero" | "ambos";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  plate?: string | null;
  rol: RolUsuario;
  avatar_url?: string | null;
}