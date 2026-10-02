import re
from datetime import datetime
from decimal import Decimal
from typing import Optional

from bson.decimal128 import Decimal128
from pymongo import ReturnDocument

from database import db as default_db
from models import ROLE_CUSTOMER, Account, Transaction, User


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
        self.col.create_index("username", unique=True, sparse=True)
        self.col.create_index("email", unique=True)

    def _to_user(self, doc) -> User:
        old_name = doc.get("name", "").split(" ", 1)
        return User(
            user_id=doc["_id"],
            first_name=doc.get("first_name") or old_name[0],
            last_name=doc.get("last_name") or (old_name[1] if len(old_name) > 1 else ""),
            username=doc.get("username") or doc.get("email", ""),
            email=doc.get("email", ""),
            password_hash=doc.get("password_hash", ""),
            role=doc.get("role", ROLE_CUSTOMER),
            created_at=doc.get("created_at", datetime.now()),
        )

    def save(self, first_name, last_name, username, email, password_hash, role) -> User:
        doc = {"_id": next_id(self.db, "users"), "first_name": first_name, "last_name": last_name,
               "username": username, "email": email, "password_hash": password_hash,
               "role": role, "created_at": datetime.now()}
        self.col.insert_one(doc)
        return self._to_user(doc)

    def find_by_id(self, user_id: int) -> Optional[User]:
        doc = self.col.find_one({"_id": user_id})
        return self._to_user(doc) if doc else None

    def find_by_username(self, username: str) -> Optional[User]:
        doc = self.col.find_one({"username": username})
        return self._to_user(doc) if doc else None

    def find_by_email(self, email: str) -> Optional[User]:
        doc = self.col.find_one({"email": email})
        return self._to_user(doc) if doc else None

    def find_customers(self, first_name: Optional[str] = None) -> list[User]:
        query = {"role": {"$ne": "ADMIN"}}
        if first_name:
            query["first_name"] = {"$regex": re.escape(first_name), "$options": "i"}
        return [self._to_user(doc) for doc in self.col.find(query).sort("_id", 1)]

    def delete(self, user_id: int) -> None:
        self.col.delete_one({"_id": user_id})


class AccountRepository:
    def __init__(self, db=None):
        self.db = db if db is not None else default_db
        self.col = self.db["accounts"]
        self.col.create_index("user_id")

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
        return [self._to_account(doc) for doc in self.col.find({"user_id": user_id}).sort("_id", 1)]

    def find_all(self) -> list[Account]:
        return [self._to_account(doc) for doc in self.col.find().sort("_id", 1)]

    def update_balance(self, account_id: int, new_balance: Decimal) -> None:
        self.col.update_one({"_id": account_id},
                            {"$set": {"balance": Decimal128(str(new_balance))}})

    def delete_by_user(self, user_id: int) -> None:
        self.col.delete_many({"user_id": user_id})


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

    def find_by_accounts(self, account_ids: list[int]) -> list[Transaction]:
        docs = self.col.find({"account_id": {"$in": account_ids}}).sort("_id", -1)
        return [self._to_txn(doc) for doc in docs]

    def count(self) -> int:
        return self.col.count_documents({})

    def delete_by_accounts(self, account_ids: list[int]) -> None:
        self.col.delete_many({"account_id": {"$in": account_ids}})