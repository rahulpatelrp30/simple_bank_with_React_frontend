import { createContext, useContext, useEffect, useState } from "react";

import { clearToken, getMe, getToken, loginRequest, logoutRequest, saveToken, signupRequest } from "./api";

const AuthContext = createContext(null);

// Keeps track of who is logged in (and their role), and shares it with every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // On page load: if we have a saved JWT, ask the API who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const result = await loginRequest(username, password);
    saveToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function signup(form) {
    const result = await signupRequest(form);
    saveToken(result.token);
    setUser(result.user);
    return result.user;
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

// Where each kind of user lands after logging in
export const homePath = (user) => (user?.role === "ADMIN" ? "/admin" : "/dashboard");
