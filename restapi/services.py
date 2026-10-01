import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import bcrypt
from dotenv import load_dotenv
import jwt

from models import ROLE_ADMIN, ROLE_CUSTOMER

load_dotenv()

# ---------- Settings (can be changed in the .env file) ----------
JWT_SECRET = os.getenv("JWT_SECRET", "simple-bank-dev-secret-change-me-in-production-2026")
JWT_ALGORITHM = "HS256"
JWT_HOURS = int(os.getenv("JWT_HOURS", "8"))
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
PREMIUM_THRESHOLD = Decimal(os.getenv("PREMIUM_THRESHOLD", "10000"))


class NotFoundError(Exception):
    pass


class BusinessRuleError(Exception):
    pass


class UnauthorizedError(Exception):
    """Not logged in, bad token, or wrong username/password -> 401."""
    pass


class ForbiddenError(Exception):
    """Logged in, but not allowed to do this -> 403."""
    pass


# ---------- Passwords: BCrypt ----------
# BCrypt adds a random salt and is deliberately slow, so stored passwords can't be read or easily cracked.
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:72], stored_hash.encode())
    except ValueError:
        return False  # not a BCrypt hash (for example, users created before BCrypt)


class AuthService:
    def __init__(self, user_repo):
        self.user_repo = user_repo

    # ----- JWT -----
    def create_token(self, user) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.user_id),
            "username": user.username,
            "role": user.role,  # ADMIN or CUSTOMER: this is what makes it an AdminToken or CustomerToken
            "iat": now,
            "exp": now + timedelta(hours=JWT_HOURS),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def token_type(user) -> str:
        return "AdminToken" if user.role == ROLE_ADMIN else "CustomerToken"

    def get_current_user(self, token: str):
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("Your session has expired. Please log in again")
        except jwt.InvalidTokenError:
            raise UnauthorizedError("Invalid token. Please log in")
        user = self.user_repo.find_by_id(int(payload["sub"]))
        if user is None:
            raise UnauthorizedError("Please log in")
        return user

    # ----- Register / login -----
    def register_customer(self, first_name, last_name, username, email, password):
        username = username.strip().lower()
        email = email.strip().lower()
        # Business rule: only the admin can have the username "admin"
        if username == ADMIN_USERNAME:
            raise BusinessRuleError('The username "admin" is reserved')
        if self.user_repo.find_by_username(username):
            raise BusinessRuleError("Username is already taken")
        if self.user_repo.find_by_email(email):
            raise BusinessRuleError("Email is already registered")
        return self.user_repo.save(first_name.strip(), last_name.strip(), username, email,
                                   hash_password(password), ROLE_CUSTOMER)

    def signup(self, first_name, last_name, username, email, password):
        user = self.register_customer(first_name, last_name, username, email, password)
        return self.create_token(user), user

    def login(self, username_or_email: str, password: str):
        key = username_or_email.strip().lower()
        user = self.user_repo.find_by_username(key) or self.user_repo.find_by_email(key)
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid username or password")
        return self.create_token(user), user

    def ensure_admin(self) -> None:
        """Creates the one and only admin user the first time the API starts."""
        if self.user_repo.find_by_username(ADMIN_USERNAME) is None:
            self.user_repo.save("System", "Admin", ADMIN_USERNAME, "admin@simplebank.local",
                                hash_password(ADMIN_PASSWORD), ROLE_ADMIN)


class AccountService:
    def __init__(self, user_repo, account_repo, txn_repo):
        self.user_repo = user_repo
        self.account_repo = account_repo
        self.txn_repo = txn_repo

    def create_account(self, user_id: int, account_type: str):
        return self.account_repo.save(user_id, account_type)

    def list_accounts(self, user_id: int):
        return self.account_repo.find_by_user(user_id)

    def get_account(self, account_id: int, current_user):
        account = self.account_repo.find_by_id(account_id)
        if account is None:
            raise NotFoundError(f"Account {account_id} not found")
        # Business rule: customers can only use their own accounts (admin can see all)
        if current_user.role != ROLE_ADMIN and account.user_id != current_user.user_id:
            raise ForbiddenError("You do not have access to this account")
        return account

    def deposit(self, account_id: int, amount: Decimal, current_user):
        if amount <= 0:
            raise BusinessRuleError("Deposit amount must be positive")
        account = self.get_account(account_id, current_user)
        self.account_repo.update_balance(account_id, account.balance + amount)
        self.txn_repo.save(account_id, "DEPOSIT", amount)
        return self.get_account(account_id, current_user)

    def withdraw(self, account_id: int, amount: Decimal, current_user):
        if amount <= 0:
            raise BusinessRuleError("Withdrawal amount must be positive")
        account = self.get_account(account_id, current_user)
        if amount > account.balance:
            raise BusinessRuleError("Insufficient balance")
        self.account_repo.update_balance(account_id, account.balance - amount)
        self.txn_repo.save(account_id, "WITHDRAW", amount)
        return self.get_account(account_id, current_user)

    def get_transactions(self, account_id: int, current_user):
        self.get_account(account_id, current_user)
        return self.txn_repo.find_by_account(account_id)


class CustomerService:
    """Customer dashboard plus the admin's customer CRUD, search and filters."""

    def __init__(self, user_repo, account_repo, txn_repo, auth_service):
        self.user_repo = user_repo
        self.account_repo = account_repo
        self.txn_repo = txn_repo
        self.auth_service = auth_service

    # ----- Customer dashboard -----
    def customer_dashboard(self, customer_id: int, current_user):
        # Business rule: a customer can only open their own dashboard
        if current_user.role != ROLE_ADMIN and current_user.user_id != customer_id:
            raise ForbiddenError("You can only view your own dashboard")
        customer = self.get_customer(customer_id)
        accounts = self.account_repo.find_by_user(customer_id)
        txns = self.txn_repo.find_by_accounts([a.account_id for a in accounts])
        return {
            "customer": customer,
            "accounts": accounts,
            "total_balance": sum((a.balance for a in accounts), Decimal("0")),
            "money_in": sum((t.amount for t in txns if t.txn_type == "DEPOSIT"), Decimal("0")),
            "money_out": sum((t.amount for t in txns if t.txn_type == "WITHDRAW"), Decimal("0")),
            "transaction_count": len(txns),
            "recent": txns[:8],
        }

    # ----- Helpers -----
    def _balances(self):
        """Total balance and account count for every customer, from one query."""
        totals = {}
        for a in self.account_repo.find_all():
            total, count = totals.get(a.user_id, (Decimal("0"), 0))
            totals[a.user_id] = (total + a.balance, count + 1)
        return totals

    def _summary(self, user, totals):
        total, count = totals.get(user.user_id, (Decimal("0"), 0))
        return {"user": user, "total_balance": total, "account_count": count,
                "premium": total >= PREMIUM_THRESHOLD}

    # ----- Admin: read -----
    def admin_dashboard(self):
        totals = self._balances()
        customers = [self._summary(u, totals) for u in self.user_repo.find_customers()]
        return {
            "total_customers": len(customers),
            "premium_customers": sum(1 for c in customers if c["premium"]),
            "total_accounts": sum(c["account_count"] for c in customers),
            "total_balance": sum((c["total_balance"] for c in customers), Decimal("0")),
            "total_transactions": self.txn_repo.count(),
            "premium_threshold": PREMIUM_THRESHOLD,
        }

    def get_all_customers(self, first_name=None, premium=None):
        totals = self._balances()
        customers = [self._summary(u, totals) for u in self.user_repo.find_customers(first_name)]
        if premium is not None:
            customers = [c for c in customers if c["premium"] == premium]
        return customers

    def get_customer(self, customer_id: int):
        user = self.user_repo.find_by_id(customer_id)
        if user is None or user.role == ROLE_ADMIN:
            raise NotFoundError(f"Customer {customer_id} not found")
        return user

    def get_customer_detail(self, customer_id: int):
        user = self.get_customer(customer_id)
        summary = self._summary(user, self._balances())
        summary["accounts"] = self.account_repo.find_by_user(customer_id)
        return summary

    # ----- Admin: create / delete -----
    def create_customer(self, first_name, last_name, username, email, password):
        user = self.auth_service.register_customer(first_name, last_name, username, email, password)
        return self._summary(user, {})

    def delete_customer(self, customer_id: int) -> None:
        self.get_customer(customer_id)  # 404 if missing, and protects the admin
        account_ids = [a.account_id for a in self.account_repo.find_by_user(customer_id)]
        self.txn_repo.delete_by_accounts(account_ids)
        self.account_repo.delete_by_user(customer_id)
        self.user_repo.delete(customer_id)
