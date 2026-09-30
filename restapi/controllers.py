from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from repositories import (AccountRepository, SessionRepository,
                          TransactionRepository, UserRepository)
from schemas import (AccountCreate, AccountResponse, AmountRequest, AuthResponse,
                     LoginRequest, SignupRequest, TransactionResponse, UserResponse)
from services import AccountService, AuthService, UnauthorizedError, UserService

user_repo = UserRepository()
session_repo = SessionRepository()
account_repo = AccountRepository()
txn_repo = TransactionRepository()
auth_service = AuthService(user_repo, session_repo)
user_service = UserService(user_repo)
account_service = AccountService(user_repo, account_repo, txn_repo)

router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)  # adds the "Authorize" button in Swagger


def get_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> str:
    if credentials is None:
        raise UnauthorizedError("Please log in")
    return credentials.credentials


def get_current_user(token: str = Depends(get_token)):
    return auth_service.get_current_user(token)


def to_user_response(user) -> UserResponse:
    return UserResponse(userId=user.user_id, name=user.name, email=user.email)


def to_account_response(account) -> AccountResponse:
    user = user_service.get_user(account.user_id)
    return AccountResponse(
        accountId=account.account_id,
        userName=user.name,
        accountType=account.account_type,
        balance=float(account.balance),
    )


@router.post("/auth/signup", response_model=AuthResponse, status_code=201)
def signup(body: SignupRequest):
    token, user = auth_service.signup(body.name, body.email, body.password)
    return AuthResponse(token=token, user=to_user_response(user))


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest):
    token, user = auth_service.login(body.email, body.password)
    return AuthResponse(token=token, user=to_user_response(user))


@router.get("/auth/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return to_user_response(user)


@router.post("/auth/logout", status_code=204)
def logout(token: str = Depends(get_token)):
    auth_service.logout(token)


@router.get("/accounts", response_model=list[AccountResponse])
def list_my_accounts(user=Depends(get_current_user)):
    return [to_account_response(a) for a in account_service.list_accounts(user.user_id)]


@router.post("/accounts", response_model=AccountResponse, status_code=201)
def create_account(body: AccountCreate, user=Depends(get_current_user)):
    account = account_service.create_account(user.user_id, body.accountType)
    return to_account_response(account)


@router.get("/accounts/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, user=Depends(get_current_user)):
    return to_account_response(account_service.get_account(account_id, user.user_id))


@router.post("/accounts/{account_id}/deposit", response_model=AccountResponse)
def deposit(account_id: int, body: AmountRequest, user=Depends(get_current_user)):
    return to_account_response(account_service.deposit(account_id, body.amount, user.user_id))


@router.post("/accounts/{account_id}/withdraw", response_model=AccountResponse)
def withdraw(account_id: int, body: AmountRequest, user=Depends(get_current_user)):
    return to_account_response(account_service.withdraw(account_id, body.amount, user.user_id))


@router.get("/accounts/{account_id}/transactions", response_model=list[TransactionResponse])
def get_transactions(account_id: int, user=Depends(get_current_user)):
    return [
        TransactionResponse(txnId=t.txn_id, type=t.txn_type,
                            amount=float(t.amount), date=t.created_at.date())
        for t in account_service.get_transactions(account_id, user.user_id)
    ]
