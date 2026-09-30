from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal


@dataclass
class User:
    user_id: int
    name: str
    email: str
    password_hash: str = ""
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Account:
    account_id: int
    user_id: int
    account_type: str
    balance: Decimal = Decimal("0.00")
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Transaction:
    txn_id: int
    account_id: int
    txn_type: str  # "DEPOSIT" or "WITHDRAW"
    amount: Decimal
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Session:
    token: str
    user_id: int
    created_at: datetime = field(default_factory=datetime.now)
