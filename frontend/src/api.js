// Data service: every call to the backend REST API lives in this file.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") + "/api";
const TOKEN_KEY = "bank_token";

// ---------- JWT token (kept in the browser so you stay logged in) ----------
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

  // Token missing or expired: send the user back to the login page
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

const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });

// ---------- Auth ----------
export const signupRequest = (form) => post("/auth/signup", form);
export const loginRequest = (email, password) => post("/auth/login", { email, password });
export const getMe = () => request("/auth/me");
export const logoutRequest = () => request("/auth/logout", { method: "POST" });

// ---------- Customer ----------
export const getCustomerDashboard = (customerId) => request(`/customerDashboard/${customerId}`);
export const getMyAccounts = () => request("/accounts");
export const createAccount = (accountType) => post("/accounts", { accountType });
export const getAccount = (id) => request(`/accounts/${id}`);
export const deposit = (id, amount) => post(`/accounts/${id}/deposit`, { amount });
export const withdraw = (id, amount) => post(`/accounts/${id}/withdraw`, { amount });
export const getTransactions = (id) => request(`/accounts/${id}/transactions`);

// ---------- Admin (needs an AdminToken) ----------
export const getAdminDashboard = () => request("/admin");

export const getAllCustomers = ({ firstName = "", premium = null } = {}) => {
  const params = new URLSearchParams();
  if (firstName) params.set("firstName", firstName);
  if (premium !== null) params.set("premium", premium);
  const query = params.toString();
  return request(`/admin/customers${query ? `?${query}` : ""}`);
};

export const getCustomerById = (id) => request(`/admin/customers/${id}`);
export const postCustomer = (form) => post("/admin/customers", form);
export const deleteCustomer = (id) => request(`/admin/customers/${id}`, { method: "DELETE" });

export const formatMoney = (value) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
