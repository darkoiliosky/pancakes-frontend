// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser, // ✅ вратено за да може refreshUser
} from "../services/authService";
import { LoginData, RegisterData } from "../types/auth";
import { User } from "../types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // ✅ додадено во типот
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Единствена авто-логин проверка по refresh кон /api/auth/me
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false); // ⬅️ овде го местиме loading
      }
    };
    fetchUser();
  }, []);

  const login = async (data: LoginData) => {
    const res = await loginUser(data);
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {
    await registerUser(data);
    // ❌ НЕ setUser овде — чекаме email verify и потоа login
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  // ✅ ново: рефрешни го user-от од backend (/api/auth/me или еквивалент во authService)
  const refreshUser = async () => {
    try {
      const res = await getCurrentUser(); // мора да праќа credentials: "include"
      setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }} // ✅ додадено refreshUser
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
