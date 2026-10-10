from tests.conftest import register_and_login

FIRST_LEVEL_SOLUTION = {"commands_f0": ["move", "move", "move"]}
SIMPLE_MAP = {
    "start": {"x": 0, "y": 0, "dir": 1},
    "stars": [{"x": 2, "y": 0}],
    "tiles": [{"x": 0, "y": 0, "color": "R"}, {"x": 1, "y": 0, "color": "R"}, {"x": 2, "y": 0, "color": "R"}],
}
SIMPLE_CONFIG = {"f0": 5, "f1": 0, "f2": 0, "tools": {"paint_red": False, "paint_green": False, "paint_blue": False}}


def test_complete_official_level_requires_real_solution(client, auth):
    bad = client.post("/api/v1/levels/official-01/complete", json={"commands_f0": ["move"]}, headers=auth)
    assert bad.status_code == 422

    good = client.post("/api/v1/levels/official-01/complete", json=FIRST_LEVEL_SOLUTION, headers=auth)
    assert good.status_code == 200
    assert good.json()["is_completed"] is True
    assert good.json()["best_steps"] == 3

    progress = client.get("/api/v1/levels/progress", headers=auth).json()
    assert [p["level_id"] for p in progress] == ["official-01"]


def test_program_save_respects_slot_limit(client, auth):
    ok = client.put("/api/v1/levels/official-01/program", json=FIRST_LEVEL_SOLUTION, headers=auth)
    assert ok.status_code == 200
    too_long = client.put("/api/v1/levels/official-01/program", json={"commands_f0": ["move"] * 5}, headers=auth)
    assert too_long.status_code == 422
    unknown = client.put("/api/v1/levels/official-01/program", json={"commands_f0": ["fly"]}, headers=auth)
    assert unknown.status_code == 422


def test_unknown_level_is_404(client, auth):
    assert client.put("/api/v1/levels/nope/program", json={}, headers=auth).status_code == 404


def test_publish_requires_valid_solution_and_delete_with_progress(client, auth):
    created = client.post(
        "/api/v1/designer/levels",
        json={"title": "測試", "map": SIMPLE_MAP, "config": SIMPLE_CONFIG},
        headers=auth,
    ).json()
    level_id = created["id"]

    bad = client.post(f"/api/v1/designer/levels/{level_id}/publish",
                      json={"solution": {"commands_f0": []}}, headers=auth)
    assert bad.status_code == 422

    good = client.post(f"/api/v1/designer/levels/{level_id}/publish",
                       json={"solution": {"commands_f0": ["move", "move"], "steps_count": 0}}, headers=auth)
    assert good.status_code == 200
    assert good.json()["status"] == "pending"
    assert good.json()["solution"]["steps_count"] == 2

    # 作者可以存草稿程式；刪除關卡時要連同存檔一起刪掉
    assert client.put(f"/api/v1/levels/{level_id}/program", json={"commands_f0": ["move"]}, headers=auth).status_code == 200
    assert client.delete(f"/api/v1/designer/levels/{level_id}", headers=auth).status_code == 204


def test_other_users_cannot_touch_unpublished_level(client, auth):
    level_id = client.post(
        "/api/v1/designer/levels",
        json={"title": "草稿", "map": SIMPLE_MAP, "config": SIMPLE_CONFIG},
        headers=auth,
    ).json()["id"]
    other = register_and_login(client, "player2")
    assert client.put(f"/api/v1/levels/{level_id}/program", json={}, headers=other).status_code == 404
    assert client.post(f"/api/v1/levels/{level_id}/complete", json={"commands_f0": ["move", "move"]},
                       headers=other).status_code == 404


def test_password_rules(client):
    short = client.post("/api/v1/auth/register", json={"username": "abc", "password": "short"})
    assert short.status_code == 422
    too_long = client.post("/api/v1/auth/register", json={"username": "abc", "password": "中" * 25})
    assert too_long.status_code == 422
    login_long = client.post("/api/v1/auth/login", json={"username": "abc", "password": "a" * 100})
    assert login_long.status_code == 401


def test_username_case_insensitive_and_normalized(client):
    register_and_login(client, "Alice")
    dup = client.post("/api/v1/auth/register", json={"username": "ａlice", "password": "long-enough"})
    assert dup.status_code == 400


def test_login_rate_limited(client):
    register_and_login(client, "bob")
    codes = [
        client.post("/api/v1/auth/login", json={"username": "bob", "password": "wrong-pass"}).status_code
        for _ in range(12)
    ]
    assert codes[-1] == 429


def test_token_role_comes_from_database(client, auth):
    me = client.get("/api/v1/auth/users/me", headers=auth).json()
    assert me["is_superuser"] is False
    assert client.get("/api/v1/admin/users", headers=auth).status_code == 403


def test_oversized_map_rejected(client, auth):
    tiles = [{"x": i % 100, "y": i // 100, "color": "R"} for i in range(20000)]
    resp = client.post(
        "/api/v1/designer/levels",
        json={"title": "大", "map": {**SIMPLE_MAP, "tiles": tiles}, "config": SIMPLE_CONFIG},
        headers=auth,
    )
    assert resp.status_code in (413, 422)


def test_chunked_oversized_body_rejected(client, auth):
    def chunks():
        for _ in range(100):
            yield b"x" * 10_000

    resp = client.post(
        "/api/v1/designer/levels",
        content=chunks(),
        headers={**auth, "content-type": "application/json"},
    )
    assert resp.status_code == 413


def test_body_without_content_length_still_accepted(client, auth):
    def body():
        yield b'{"commands_f0": ["move"]}'

    resp = client.put(
        "/api/v1/levels/official-01/program",
        content=body(),
        headers={**auth, "content-type": "application/json"},
    )
    assert resp.status_code == 200
