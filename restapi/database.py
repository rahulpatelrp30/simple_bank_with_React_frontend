import os

from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "simple_bank")

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]
