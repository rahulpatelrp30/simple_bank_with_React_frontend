import { formatMoney } from "../api";

// 1234.5 -> "$1,234.50"
export const money = (value) => "$" + formatMoney(value);

// 1 -> masked account number like "**** 0001"
export const maskedNumber = (id) => "\u2022\u2022\u2022\u2022 " + String(id).padStart(4, "0");

// Product name shown for each account type
export const accountName = (type) => (type === "CURRENT" ? "Simple Current" : "Simple Savings");

// Same rule as the backend: premium = total balance of 10,000 or more
export const PREMIUM_THRESHOLD = 10000;
