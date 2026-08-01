def _first_destination_id(client):
    return client.get("/destinations").json()[0]["id"]


def test_create_itinerary_requires_auth(client, signed_up_user):
    _, user = signed_up_user
    res = client.post(
        "/itineraries", json={"user_id": user["id"], "title": "Trip", "items": []}
    )
    assert res.status_code == 401


def test_create_itinerary_success(client, signed_up_user):
    token, user = signed_up_user
    res = client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "Weekend trip", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Weekend trip"
    assert body["user_id"] == user["id"]


def test_create_itinerary_for_someone_else_forbidden(client, signed_up_user):
    token, _ = signed_up_user
    res = client.post(
        "/itineraries",
        json={"user_id": "someone-elses-id", "title": "Trip", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_create_itinerary_with_unknown_destination(client, signed_up_user):
    token, user = signed_up_user
    res = client.post(
        "/itineraries",
        json={
            "user_id": user["id"],
            "title": "Trip",
            "items": [{"destination_id": "does-not-exist", "day": 1}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404


def test_get_itinerary_is_public(client, signed_up_user):
    token, user = signed_up_user
    created = client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "Public trip", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    # No Authorization header at all - simulates a friend clicking a shared link
    res = client.get(f"/itineraries/{created['id']}")
    assert res.status_code == 200
    assert res.json()["title"] == "Public trip"


def test_update_itinerary_requires_ownership(client, signed_up_user):
    token, user = signed_up_user
    created = client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "Original", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    other_token, _ = _signup_second_user(client)
    res = client.put(
        f"/itineraries/{created['id']}",
        json={"title": "Hijacked"},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert res.status_code == 403

    res = client.put(
        f"/itineraries/{created['id']}",
        json={"title": "Renamed"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed"


def test_delete_itinerary_requires_ownership(client, signed_up_user):
    token, user = signed_up_user
    created = client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "To delete", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    other_token, _ = _signup_second_user(client)
    forbidden = client.delete(
        f"/itineraries/{created['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden.status_code == 403

    allowed = client.delete(
        f"/itineraries/{created['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert allowed.status_code == 204

    gone = client.get(f"/itineraries/{created['id']}")
    assert gone.status_code == 404


def test_share_itinerary(client, signed_up_user):
    token, user = signed_up_user
    created = client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "Shared trip", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    res = client.post(
        f"/itineraries/{created['id']}/share",
        json={"email": "friend@example.com"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert "friend@example.com" in res.json()["shared_with"]


def test_user_itineraries_listing(client, signed_up_user):
    token, user = signed_up_user
    client.post(
        "/itineraries",
        json={"user_id": user["id"], "title": "Trip A", "items": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    res = client.get(f"/users/{user['id']}/itineraries")
    assert res.status_code == 200
    assert any(i["title"] == "Trip A" for i in res.json())


def _signup_second_user(client):
    import uuid

    email = f"other-{uuid.uuid4().hex[:10]}@example.com"
    res = client.post(
        "/auth/signup",
        json={"name": "Other User", "email": email, "password": "otherpass1"},
    )
    body = res.json()
    return body["access_token"], body["user"]
