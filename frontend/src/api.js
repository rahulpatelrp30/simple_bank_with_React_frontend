const BASE_URL = "http://127.0.0.1:8000/api";
const TOKEN_KEY = "bank_token";

// ---------- Login token (kept in the browser so you stay logged in) ----------
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(BASE_URL + path, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the API. Is the backend running?");
  }

  // Logged out or session expired: send the user back to the login page
  if (response.status === 401 && !path.startsWith("/auth/")) {
    clearToken();
    window.location.href = "/login";
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) throw new Error(detail.map((d) => d.msg).join(", "));
    throw new Error("Something went wrong");
  }
  return data;
}

// ---------- Auth ----------
export const signupRequest = (name, email, password) =>
  request("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const loginRequest = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getMe = () => request("/auth/me");

export const logoutRequest = () => request("/auth/logout", { method: "POST" });

// ---------- Accounts ----------
export const getMyAccounts = () => request("/accounts");

export const createAccount = (accountType) =>
  request("/accounts", { method: "POST", body: JSON.stringify({ accountType }) });

export const getAccount = (id) => request(`/accounts/${id}`);

export const deposit = (id, amount) =>
  request(`/accounts/${id}/deposit`, { method: "POST", body: JSON.stringify({ amount }) });

export const withdraw = (id, amount) =>
  request(`/accounts/${id}/withdraw`, { method: "POST", body: JSON.stringify({ amount }) });

export const getTransactions = (id) => request(`/accounts/${id}/transactions`);

export const formatMoney = (value) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });