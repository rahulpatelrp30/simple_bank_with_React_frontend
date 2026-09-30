import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from decimal import Decimal

SESSION_DAYS = 7  # how long a login stays valid


class NotFoundError(Exception):
    pass


class BusinessRuleError(Exception):
    pass


class UnauthorizedError(Exception):
    """Not logged in, or wrong email/password."""
    pass


class ForbiddenError(Exception):
    """Logged in, but trying to use someone else's account."""
    pass


# Passwords are never stored as plain text: we store a random salt plus a slow one-way hash.
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, expected = stored.split("$", 1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000)
    return hmac.compare_digest(digest.hex(), expected)


class AuthService:
    def __init__(self, user_repo, session_repo):
        self.user_repo = user_repo
        self.session_repo = session_repo

    def signup(self, name: str, email: str, password: str):
        email = email.strip().lower()
        if self.user_repo.find_by_email(email):
            raise BusinessRuleError("Email is already registered")
        user = self.user_repo.save(name.strip(), email, hash_password(password))
        return self._start_session(user)

    def login(self, email: str, password: str):
        user = self.user_repo.find_by_email(email.strip().lower())
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return self._start_session(user)

    def _start_session(self, user):
        token = secrets.token_urlsafe(32)
        self.session_repo.save(token, user.user_id)
        return token, user

    def get_current_user(self, token: str):
        session = self.session_repo.find(token) if token else None
        if session is None:
            raise UnauthorizedError("Please log in")
        if datetime.now() - session.created_at > timedelta(days=SESSION_DAYS):
            self.session_repo.delete(token)
            raise UnauthorizedError("Your session has expired. Please log in again")
        user = self.user_repo.find_by_id(session.user_id)
        if user is None:
            raise UnauthorizedError("Please log in")
        return user

    def logout(self, token: str) -> None:
        self.session_repo.delete(token)


class UserService:
    def __init__(self, user_repo):
        self.user_repo = user_repo

    def get_user(self, user_id: int):
        user = self.user_repo.find_by_id(user_id)
        if user is None:
            raise NotFoundError(f"User {user_id} not found")
        return user


class AccountService:
    def __init__(self, user_repo, account_repo, txn_repo):
        self.user_repo = user_repo
        self.account_repo = account_repo
        self.txn_repo = txn_repo

    def create_account(self, user_id: int, account_type: str):
        return self.account_repo.save(user_id, account_type)

    def list_accounts(self, user_id: int):
        return self.account_repo.find_by_user(user_id)

    def get_account(self, account_id: int, user_id: int):
        account = self.account_repo.find_by_id(account_id)
        if account is None:
            raise NotFoundError(f"Account {account_id} not found")
        # Business rule: users can only see and use their own accounts
        if account.user_id != user_id:
            raise ForbiddenError("You do not have access to this account")
        return account

    def deposit(self, account_id: int, amount: Decimal, user_id: int):
        if amount <= 0:
            raise BusinessRuleError("Deposit amount must be positive")
        account = self.get_account(account_id, user_id)
        self.account_repo.update_balance(account_id, account.balance + amount)
        self.txn_repo.save(account_id, "DEPOSIT", amount)
        return self.get_account(account_id, user_id)

    def withdraw(self, account_id: int, amount: Decimal, user_id: int):
        if amount <= 0:
            raise BusinessRuleError("Withdrawal amount must be positive")
        account = self.get_account(account_id, user_id)
        if amount > account.balance:
            raise BusinessRuleError("Insufficient balance")
        self.account_repo.update_balance(account_id, account.balance - amount)
        self.txn_repo.save(account_id, "WITHDRAW", amount)
        return self.get_account(account_id, user_id)

    def get_transactions(self, account_id: int, user_id: int):
        self.get_account(account_id, user_id)
        return self.txn_repo.find_by_account(account_id)
