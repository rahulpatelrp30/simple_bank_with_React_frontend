# Simple Bank Application

Full-stack banking app built for the Citi training project.

- **Backend:** Python, FastAPI, MongoDB (`restapi/`)
- **Frontend:** React + Vite (`frontend/`)
- **Features:** sign up and log in, open savings and current accounts, deposit, withdraw, transaction history, dashboard

## Business rules

- Deposit and withdrawal amounts must be positive
- You cannot withdraw more than the balance
- Every deposit and withdrawal is recorded as a transaction
- Users can only see and use their own accounts
- Passwords are stored as salted hashes, never as plain text

## How to run

**Backend** (MongoDB must be running on localhost:27017)

    cd restapi
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    python -m uvicorn main:app --reload

API docs: http://127.0.0.1:8000/docs

**Frontend**

    cd frontend
    npm install
    npm run dev

Website: http://localhost:5173

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Create a user and log in |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Current user |
| POST | /api/auth/logout | Log out |
| GET | /api/accounts | List my accounts |
| POST | /api/accounts | Open an account |
| GET | /api/accounts/{id} | Account details |
| POST | /api/accounts/{id}/deposit | Deposit money |
| POST | /api/accounts/{id}/withdraw | Withdraw money |
| GET | /api/accounts/{id}/transactions | Transaction history |

## Screenshots

See the `restapi/screenshots` folder.
