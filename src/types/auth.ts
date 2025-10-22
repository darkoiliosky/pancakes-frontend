// src/types/auth.ts
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
}

// ✅ Ново: backend често враќа само порака при регистрација
export interface RegisterResponse {
  message: string; // "Verification email sent" или слично
  user?: AuthResponse["user"]; // понекогаш може и да врати user, па оставаме optional
}
