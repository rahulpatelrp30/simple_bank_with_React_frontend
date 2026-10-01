import { formatMoney } from "../api";

// 1234.5 -> "$1,234.50"
export const money = (value) => "$" + formatMoney(value);

// 1 -> masked account number like "**** 0001"
export const maskedNumber = (id) => "\u2022\u2022\u2022\u2022 " + String(id).padStart(4, "0");
