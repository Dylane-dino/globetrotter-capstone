def test_signup_success(client, unique_email):
    res = client.post(
        "/auth/signup",
        json={
            "name": "Ada",
            "email": unique_email,
            "password": "securepass1",
            "preferred_tags": ["museum"],
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"]
    assert body["user"]["email"] == unique_email
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_signup_duplicate_email_conflicts(client, unique_email):
    payload = {"name": "Ada", "email": unique_email, "password": "securepass1"}
    first = client.post("/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/auth/signup", json=payload)
    assert second.status_code == 409


def test_signup_rejects_short_password(client, unique_email):
    res = client.post(
        "/auth/signup",
        json={"name": "Ada", "email": unique_email, "password": "abc"},
    )
    assert res.status_code == 422


def test_login_success(client, unique_email):
    client.post(
        "/auth/signup",
        json={"name": "Ada", "email": unique_email, "password": "securepass1"},
    )
    res = client.post(
        "/auth/login", json={"email": unique_email, "password": "securepass1"}
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_login_wrong_password(client, unique_email):
    client.post(
        "/auth/signup",
        json={"name": "Ada", "email": unique_email, "password": "securepass1"},
    )
    res = client.post(
        "/auth/login", json={"email": unique_email, "password": "wrongpassword"}
    )
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "whatever1"}
    )
    assert res.status_code == 401


def test_me_requires_token(client):
    res = client.get("/auth/me")
    assert res.status_code == 401


def test_me_with_valid_token(client, signed_up_user):
    token, user = signed_up_user
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["id"] == user["id"]


def test_me_with_garbage_token(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401
