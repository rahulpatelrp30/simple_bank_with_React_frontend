from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


# ---------- Auth ----------
class SignupRequest(BaseModel):
    firstName: str = Field(min_length=1, max_length=50)
    lastName: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")
    email: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    username: str  # username or email
    password: str


class UserResponse(BaseModel):
    userId: int
    firstName: str
    lastName: str
    username: str
    email: str
    role: str


class AuthResponse(BaseModel):
    token: str
    tokenType: str  # "AdminToken" or "CustomerToken"
    role: str
    user: UserResponse


# ---------- Accounts ----------
class AccountCreate(BaseModel):
    accountType: Literal["SAVINGS", "CURRENT"]


class AmountRequest(BaseModel):
    amount: Decimal


class AccountResponse(BaseModel):
    accountId: int
    userId: int
    userName: str
    accountType: str
    balance: float


class TransactionResponse(BaseModel):
    txnId: int
    accountId: int
    type: str
    amount: float
    date: date


# ---------- Dashboards ----------
class CustomerDashboardResponse(BaseModel):
    customer: UserResponse
    accounts: list[AccountResponse]
    totalBalance: float
    moneyIn: float
    moneyOut: float
    transactionCount: int
    recentTransactions: list[TransactionResponse]


class CustomerSummary(BaseModel):
    customerId: int
    firstName: str
    lastName: str
    username: str
    email: str
    accountCount: int
    totalBalance: float
    premium: bool
    joined: date


class CustomerDetail(CustomerSummary):
    accounts: list[AccountResponse]


class AdminDashboardResponse(BaseModel):
    totalCustomers: int
    premiumCustomers: int
    totalAccounts: int
    totalBalance: float
    totalTransactions: int
    premiumThreshold: float
