from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from models import ROLE_ADMIN
from repositories import AccountRepository, TransactionRepository, UserRepository
from schemas import (AccountCreate, AccountResponse, AdminDashboardResponse, AmountRequest,
                     AuthResponse, CustomerDashboardResponse, CustomerDetail, CustomerSummary,
                     LoginRequest, SignupRequest, TransactionResponse, UserResponse)
from services import (AccountService, AuthService, CustomerService, ForbiddenError,
                      UnauthorizedError)

# Wiring: create repositories and give them to the services
user_repo = UserRepository()
account_repo = AccountRepository()
txn_repo = TransactionRepository()
auth_service = AuthService(user_repo)
account_service = AccountService(user_repo, account_repo, txn_repo)
customer_service = CustomerService(user_repo, account_repo, txn_repo, auth_service)

router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)  # adds the "Authorize" button in Swagger


# ---------- Security helpers ----------
def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    """Reads the JWT from 'Authorization: Bearer <token>' and returns the logged-in user."""
    if credentials is None:
        raise UnauthorizedError("Please log in")
    return auth_service.get_current_user(credentials.credentials)


def require_admin(user=Depends(get_current_user)):
    """Only an AdminToken gets past this. A CustomerToken gets 403 Forbidden."""
    if user.role != ROLE_ADMIN:
        raise ForbiddenError("Forbidden: admin access only")
    return user


# ---------- Converters (model -> JSON response) ----------
def to_user(user) -> UserResponse:
    return UserResponse(userId=user.user_id, firstName=user.first_name, lastName=user.last_name,
                        username=user.username, email=user.email, role=user.role)


def to_account(account) -> AccountResponse:
    owner = user_repo.find_by_id(account.user_id)
    return AccountResponse(accountId=account.account_id, userId=account.user_id,
                           userName=owner.full_name if owner else "Unknown",
                           accountType=account.account_type, balance=float(account.balance))


def to_txn(t) -> TransactionResponse:
    return TransactionResponse(txnId=t.txn_id, accountId=t.account_id, type=t.txn_type,
                               amount=float(t.amount), date=t.created_at.date())


def to_summary(s) -> CustomerSummary:
    u = s["user"]
    return CustomerSummary(customerId=u.user_id, firstName=u.first_name, lastName=u.last_name,
                           username=u.username, email=u.email, accountCount=s["account_count"],
                           totalBalance=float(s["total_balance"]), premium=s["premium"],
                           joined=u.created_at.date())


def auth_response(token, user) -> AuthResponse:
    return AuthResponse(token=token, tokenType=AuthService.token_type(user),
                        role=user.role, user=to_user(user))


# ---------- Auth ----------
@router.post("/auth/signup", response_model=AuthResponse, status_code=201, tags=["Auth"])
def signup(body: SignupRequest):
    token, user = auth_service.signup(body.firstName, body.lastName, body.username,
                                      body.email, body.password)
    return auth_response(token, user)


@router.post("/auth/login", response_model=AuthResponse, tags=["Auth"])
def login(body: LoginRequest):
    token, user = auth_service.login(body.username, body.password)
    return auth_response(token, user)


@router.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def me(user=Depends(get_current_user)):
    return to_user(user)


@router.post("/auth/logout", status_code=204, tags=["Auth"])
def logout(user=Depends(get_current_user)):
    # JWTs are stateless: logging out means the frontend deletes its token
    return None


# ---------- Customer dashboard ----------
@router.get("/customerDashboard/{customer_id}", response_model=CustomerDashboardResponse,
            tags=["Customer"])
def customer_dashboard(customer_id: int, user=Depends(get_current_user)):
    d = customer_service.customer_dashboard(customer_id, user)
    return CustomerDashboardResponse(
        customer=to_user(d["customer"]),
        accounts=[to_account(a) for a in d["accounts"]],
        totalBalance=float(d["total_balance"]),
        moneyIn=float(d["money_in"]),
        moneyOut=float(d["money_out"]),
        transactionCount=d["transaction_count"],
        recentTransactions=[to_txn(t) for t in d["recent"]],
    )


# ---------- Accounts ----------
@router.get("/accounts", response_model=list[AccountResponse], tags=["Accounts"])
def list_my_accounts(user=Depends(get_current_user)):
    return [to_account(a) for a in account_service.list_accounts(user.user_id)]


@router.post("/accounts", response_model=AccountResponse, status_code=201, tags=["Accounts"])
def create_account(body: AccountCreate, user=Depends(get_current_user)):
    return to_account(account_service.create_account(user.user_id, body.accountType))


@router.get("/accounts/{account_id}", response_model=AccountResponse, tags=["Accounts"])
def get_account(account_id: int, user=Depends(get_current_user)):
    return to_account(account_service.get_account(account_id, user))


@router.post("/accounts/{account_id}/deposit", response_model=AccountResponse, tags=["Accounts"])
def deposit(account_id: int, body: AmountRequest, user=Depends(get_current_user)):
    return to_account(account_service.deposit(account_id, body.amount, user))


@router.post("/accounts/{account_id}/withdraw", response_model=AccountResponse, tags=["Accounts"])
def withdraw(account_id: int, body: AmountRequest, user=Depends(get_current_user)):
    return to_account(account_service.withdraw(account_id, body.amount, user))


@router.get("/accounts/{account_id}/transactions", response_model=list[TransactionResponse],
            tags=["Accounts"])
def get_transactions(account_id: int, user=Depends(get_current_user)):
    return [to_txn(t) for t in account_service.get_transactions(account_id, user)]


# ---------- Admin (AdminToken only) ----------
@router.get("/admin", response_model=AdminDashboardResponse, tags=["Admin"])
def admin_dashboard(admin=Depends(require_admin)):
    d = customer_service.admin_dashboard()
    return AdminDashboardResponse(
        totalCustomers=d["total_customers"], premiumCustomers=d["premium_customers"],
        totalAccounts=d["total_accounts"], totalBalance=float(d["total_balance"]),
        totalTransactions=d["total_transactions"], premiumThreshold=float(d["premium_threshold"]),
    )


@router.get("/admin/customers", response_model=list[CustomerSummary], tags=["Admin"])
def get_all_customers(firstName: Optional[str] = Query(None, description="Search by first name"),
                      premium: Optional[bool] = Query(None, description="true = premium customers only"),
                      admin=Depends(require_admin)):
    return [to_summary(c) for c in customer_service.get_all_customers(firstName, premium)]


@router.get("/admin/customers/{customer_id}", response_model=CustomerDetail, tags=["Admin"])
def get_customer_by_id(customer_id: int, admin=Depends(require_admin)):
    d = customer_service.get_customer_detail(customer_id)
    return CustomerDetail(**to_summary(d).model_dump(), accounts=[to_account(a) for a in d["accounts"]])


@router.post("/admin/customers", response_model=CustomerSummary, status_code=201, tags=["Admin"])
def post_customer(body: SignupRequest, admin=Depends(require_admin)):
    return to_summary(customer_service.create_customer(body.firstName, body.lastName,
                                                       body.username, body.email, body.password))


@router.delete("/admin/customers/{customer_id}", status_code=204, tags=["Admin"])
def delete_customer(customer_id: int, admin=Depends(require_admin)):
    customer_service.delete_customer(customer_id)
