def test_chat_requires_a_signed_in_user(client):
    response = client.post("/chat", json={"message": "Plan my afternoon"})

    assert response.status_code == 401
