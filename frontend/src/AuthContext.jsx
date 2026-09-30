import { createContext, useContext, useEffect, useState } from "react";

import { clearToken, getMe, getToken, loginRequest, logoutRequest, saveToken, signupRequest } from "./api";

const AuthContext = createContext(null);

// Keeps track of who is logged in, and shares it with every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // On page load: if we have a saved token, ask the API who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await loginRequest(email, password);
    saveToken(result.token);
    setUser(result.user);
  }

  async function signup(name, email, password) {
    const result = await signupRequest(name, email, password);
    saveToken(result.token);
    setUser(result.user);
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Even if the API call fails, still log out on this device
    }
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}