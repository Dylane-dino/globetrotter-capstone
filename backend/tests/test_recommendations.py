def test_recommendations_by_tags(client):
    res = client.post(
        "/recommendations",
        json={"preferred_tags": ["nature", "hiking"], "limit": 5},
    )
    assert res.status_code == 200
    results = res.json()
    assert len(results) <= 5
    for d in results:
        assert "score" in d


def test_recommendations_respects_limit(client):
    res = client.post("/recommendations", json={"preferred_tags": [], "limit": 3})
    assert res.status_code == 200
    assert len(res.json()) <= 3


def test_recommendations_exclude_hospital(client):
    res = client.post(
        "/recommendations",
        json={"preferred_tags": ["healthcare", "medical", "emergency"], "limit": 15},
    )
    assert res.status_code == 200
    categories = [d["category"] for d in res.json()]
    assert "hospital" not in categories


def test_recommendations_by_user_id(client, signed_up_user):
    _, user = signed_up_user
    res = client.post(
        "/recommendations", json={"user_id": user["id"], "limit": 5}
    )
    assert res.status_code == 200


def test_recommendations_unknown_user_id(client):
    res = client.post(
        "/recommendations", json={"user_id": "does-not-exist", "limit": 5}
    )
    assert res.status_code == 404
