from datetime import datetime
from decimal import Decimal
from typing import Optional

from bson.decimal128 import Decimal128
from pymongo import ReturnDocument

from database import db as default_db
from models import Account, Session, Transaction, User


def next_id(db, name: str) -> int:
    """Gives 1, 2, 3... for each collection, like AUTO_INCREMENT in SQL."""
    counter = db["counters"].find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return counter["seq"]


class UserRepository:
    def __init__(self, db=None):
        self.db = db if db is not None else default_db
        self.col = self.db["users"]
        self.col.create_index("email", unique=True)

    def _to_user(self, doc) -> User:
        return User(user_id=doc["_id"], name=doc["name"], email=doc["email"],
                    password_hash=doc.get("password_hash", ""),
                    created_at=doc["created_at"])

    def save(self, name: str, email: str, password_hash: str) -> User:
        doc = {"_id": next_id(self.db, "users"), "name": name, "email": email,
               "password_hash": password_hash, "created_at": datetime.now()}
        self.col.insert_one(doc)
        return self._to_user(doc)

    def find_by_id(self, user_id: int) -> Optional[User]:
        doc = self.col.find_one({"_id": user_id})
        return self._to_user(doc) if doc else None

    def find_by_email(self, email: str) -> Optional[User]:
        doc = self.col.find_one({"email": email})
        return self._to_user(doc) if doc else None


class SessionRepository:
    def __init__(self, db=None):
        self.db = db if db is not None else default_db
        self.col = self.db["sessions"]

    def save(self, token: str, user_id: int) -> Session:
        doc = {"_id": token, "user_id": user_id, "created_at": datetime.now()}
        self.col.insert_one(doc)
        return Session(token=token, user_id=user_id, created_at=doc["created_at"])

    def find(self, token: str) -> Optional[Session]:
        doc = self.col.find_one({"_id": token})
        if doc is None:
            return None
        return Session(token=doc["_id"], user_id=doc["user_id"], created_at=doc["created_at"])

    def delete(self, token: str) -> None:
        self.col.delete_one({"_id": token})


class AccountRepository:
    def __init__(self, db=None):
        self.db = db if db is not None else default_db
        self.col = self.db["accounts"]

    def _to_account(self, doc) -> Account:
        return Account(account_id=doc["_id"], user_id=doc["user_id"],
                       account_type=doc["account_type"],
                       balance=doc["balance"].to_decimal(),
                       created_at=doc["created_at"])

    def save(self, user_id: int, account_type: str) -> Account:
        doc = {"_id": next_id(self.db, "accounts"), "user_id": user_id,
               "account_type": account_type, "balance": Decimal128("0.00"),
               "created_at": datetime.now()}
        self.col.insert_one(doc)
        return self._to_account(doc)

    def find_by_id(self, account_id: int) -> Optional[Account]:
        doc = self.col.find_one({"_id": account_id})
        return self._to_account(doc) if doc else None

    def find_by_user(self, user_id: int) -> list[Account]:
        docs = self.col.find({"user_id": user_id}).sort("_id", 1)
        return [self._to_account(d) for d in docs]

    def update_balance(self, account_id: int, new_balance: Decimal) -> None:
        self.col.update_one({"_id": account_id},
                            {"$set": {"balance": Decimal128(str(new_balance))}})


class TransactionRepository:
    def __init__(self, db=None):
        self.db = db if db is not None else default_db
        self.col = self.db["transactions"]
        self.col.create_index("account_id")

    def _to_txn(self, doc) -> Transaction:
        return Transaction(txn_id=doc["_id"], account_id=doc["account_id"],
                           txn_type=doc["txn_type"], amount=doc["amount"].to_decimal(),
                           created_at=doc["created_at"])

    def save(self, account_id: int, txn_type: str, amount: Decimal) -> Transaction:
        doc = {"_id": next_id(self.db, "transactions"), "account_id": account_id,
               "txn_type": txn_type, "amount": Decimal128(str(amount)),
               "created_at": datetime.now()}
        self.col.insert_one(doc)
        return self._to_txn(doc)

    def find_by_account(self, account_id: int) -> list[Transaction]:
        docs = self.col.find({"account_id": account_id}).sort("_id", 1)
        return [self._to_txn(d) for d in docs]
