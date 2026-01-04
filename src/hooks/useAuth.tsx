import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import axios from "axios";

// Define User Interface based on our MongoDB Schema
interface DailyMission {
  id: string;
  title: string;
  type: string;
  target: number;
  progress: number;
  completed: boolean;
  reward: number;
}

interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  points: number;
  role?: string;
  streak?: number;
  hostel?: string;
  dailyMissions?: DailyMission[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; user: User | null }>;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:5000/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persisted user
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { credential });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login Failed:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, password, username });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.error || "Registration failed" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", response.data.token);
      return { error: null, user: userData };
    } catch (error: any) {
      return { error: error.response?.data?.error || "Login failed", user: null };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Admin check based on role from database
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, signUp, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
