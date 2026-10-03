# Simple Bank Application

Full-stack banking application built for the Citi Full Stack React training project.

**Live demo (AWS):** https://d3li9k2w14a3p5.cloudfront.net

## Tech stack

| Layer | Technology | Folder |
|---|---|---|
| Frontend | React + Vite, React Router, Fetch data service | `frontend/` |
| Backend | Python, FastAPI (Controllers -> Services -> Repositories -> DB) | `restapi/` |
| Database | MongoDB Atlas | |
| Security | JWT with roles (AdminToken / CustomerToken), BCrypt password hashing | |
| Hosting | AWS: S3 + CloudFront (website), Lambda + API Gateway (backend) | |

## Features

**Customers:** sign up and sign on with email and password, open savings and current accounts, deposit, withdraw, account summary dashboard, transaction history with filters.

**Admin:** admin dashboard with totals, get all customers, get customer by ID, add customer, delete customer, search by first name, filter premium customers (total balance of 10,000 or more).

## Business rules and security

- Passwords are hashed with BCrypt, never stored as plain text
- The server generates a JWT on sign on; the token carries the user's role (AdminToken or CustomerToken)
- Only the admin can have the username `admin`
- `/api/admin/...` is admin-only: a CustomerToken gets **403 Forbidden**
- A customer can only open their own dashboard (`/api/customerDashboard/{id}`) and accounts
- Deposits and withdrawals must be positive; you cannot withdraw more than the balance
- Every deposit and withdrawal is recorded as a transaction

## AWS architecture

    Browser -> CloudFront -> S3 bucket (React website)
    React   -> API Gateway -> Lambda (FastAPI via Mangum) -> MongoDB Atlas

- The backend runs on Lambda (Python 3.12) using `lambda_handler.handler`
- Settings (`MONGO_URL`, `MONGO_DB`, `JWT_SECRET`, `ADMIN_PASSWORD`, `PREMIUM_THRESHOLD`, `CORS_ORIGINS`) are Lambda environment variables
- The frontend reads the API address from `frontend/.env.production` (`VITE_API_URL`)

## Run locally

**Backend**

    cd restapi
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    copy .env.example .env
    python -m uvicorn main:app --reload

Edit `.env` to set `MONGO_URL` (local MongoDB or MongoDB Atlas).
API docs: http://127.0.0.1:8000/docs. The admin user is created automatically on first start.

**Frontend**

    cd frontend
    npm install
    npm run dev

Website: http://localhost:5173

## API endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Signed on |
| GET | /api/customerDashboard/{id} | Own customer or admin |
| GET / POST | /api/accounts | Customer |
| GET | /api/accounts/{id} | Owner or admin |
| POST | /api/accounts/{id}/deposit | Owner or admin |
| POST | /api/accounts/{id}/withdraw | Owner or admin |
| GET | /api/accounts/{id}/transactions | Owner or admin |
| GET | /api/admin | Admin |
| GET | /api/admin/customers?firstName=&premium= | Admin |
| GET | /api/admin/customers/{id} | Admin |
| POST | /api/admin/customers | Admin |
| DELETE | /api/admin/customers/{id} | Admin |

## Postman

Import `restapi/Simple_Bank_API_JWT.postman_collection.json` and run the collection: 28 requests, 110 tests passing.

## Screenshots

See the `restapi/Screenshots` folder.
