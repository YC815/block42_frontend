import os

os.environ.setdefault("DATABASE_URL", "postgresql://block42:block42@localhost:5432/block42_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-0123456789abcdef0123456789")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import rate_limit  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app import models  # noqa: E402,F401


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    for limiter in (rate_limit.login_limiter, rate_limit.register_limiter):
        limiter._hits.clear()
    yield


@pytest.fixture
def client():
    with TestClient(fastapi_app) as c:
        yield c


def register_and_login(client, username="player1", password="correct-horse"):
    assert client.post("/api/v1/auth/register", json={"username": username, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"username": username, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    return register_and_login(client)
