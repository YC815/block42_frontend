"""認證 API - 註冊、登入"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserOut, Token
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_dummy_password,
    verify_password,
)
from app.core.deps import get_current_user
from app.core.rate_limit import client_ip, login_limiter, register_limiter

router = APIRouter(prefix="/auth", tags=["auth"])


def username_taken(db: Session, username: str) -> bool:
    """不分大小寫檢查，避免 Admin／admin 這類冒充"""
    return db.query(User).filter(func.lower(User.username) == username.lower()).first() is not None


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """註冊新使用者

    Raises:
        HTTPException 400: 使用者名稱已存在
        HTTPException 429: 嘗試次數太多
    """
    register_limiter.check(f"ip:{client_ip(request)}")

    if username_taken(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="使用者名稱已存在"
        )

    user = User(
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """登入取得 token

    Raises:
        HTTPException 401: 帳號或密碼錯誤
        HTTPException 429: 嘗試次數太多
    """
    login_limiter.check(f"ip:{client_ip(request)}", f"user:{user_data.username.lower()}")

    user = db.query(User).filter(User.username == user_data.username).first()
    if user is None:
        verify_dummy_password(user_data.password)
    if user is None or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/users/me", response_model=UserOut)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """獲取當前登入用戶資訊"""
    return current_user
