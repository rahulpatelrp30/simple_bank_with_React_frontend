import os

from dotenv import load_dotenv
from pymongo import MongoClient

# Reads settings from a .env file in this folder (if there is one)
load_dotenv()

# Local MongoDB by default. For MongoDB Atlas, put your Atlas connection string
# in the .env file as MONGO_URL=mongodb+srv://...
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "simple_bank")

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=8000)
db = client[DB_NAME]
