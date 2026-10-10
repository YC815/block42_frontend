"""把已註冊的帳號提升為管理員

先在網站上用強密碼註冊帳號，再執行：
    uv run python -m scripts.promote_superuser <username>
"""
import argparse
import sys

from app.database import SessionLocal
from app.models.user import User


def main() -> None:
    parser = argparse.ArgumentParser(description="將 Block42 帳號提升為管理員")
    parser.add_argument("username")
    args = parser.parse_args()

    with SessionLocal() as db:
        user = db.query(User).filter(User.username == args.username).first()
        if not user:
            sys.exit(f"找不到帳號 {args.username}，請先註冊")
        user.is_superuser = True
        db.commit()
        print(f"{user.username}（ID {user.id}）已是管理員")


if __name__ == "__main__":
    main()
