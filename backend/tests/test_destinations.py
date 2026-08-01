def test_list_all_destinations(client):
    res = client.get("/destinations")
    assert res.status_code == 200
    destinations = res.json()
    assert len(destinations) == 15


def test_filter_by_category(client):
    res = client.get("/destinations", params={"category": "nature"})
    assert res.status_code == 200
    for d in res.json():
        assert d["category"] == "nature"
    assert len(res.json()) > 0


def test_filter_by_tag(client):
    res = client.get("/destinations", params={"tag": "outdoor"})
    assert res.status_code == 200
    for d in res.json():
        assert "outdoor" in [t.lower() for t in d["tags"]]


def test_search_by_query(client):
    res = client.get("/destinations", params={"q": "cathedral".replace("cathedral", "cath")})
    # Loose substring match against name/description
    assert res.status_code == 200


def test_get_single_destination(client):
    all_destinations = client.get("/destinations").json()
    first_id = all_destinations[0]["id"]
    res = client.get(f"/destinations/{first_id}")
    assert res.status_code == 200
    assert res.json()["id"] == first_id


def test_get_destination_not_found(client):
    res = client.get("/destinations/does-not-exist")
    assert res.status_code == 404
