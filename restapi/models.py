from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

ROLE_ADMIN = "ADMIN"
ROLE_CUSTOMER = "CUSTOMER"


@dataclass
class User:
    user_id: int
    first_name: str
    last_name: str
    username: str
    email: str
    password_hash: str = ""
    role: str = ROLE_CUSTOMER
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


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
