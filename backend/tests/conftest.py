"""
Redirects the app's data directory to an isolated temp copy BEFORE the app
(and therefore app.storage) is imported anywhere. This has to happen at
module import time, not inside a fixture, because app.storage.DATA_DIR is
computed once at import time.

The upshot: running the test suite never reads or writes the real
data/*.json files that ship with the project.
"""

import atexit
import os
import shutil
import tempfile
import uuid
from pathlib import Path

_REAL_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="globetrotter_test_"))

shutil.copy(_REAL_DATA_DIR / "destinations.json", _TEST_DATA_DIR / "destinations.json")
(_TEST_DATA_DIR / "users.json").write_text("[]")
(_TEST_DATA_DIR / "itineraries.json").write_text("[]")

os.environ["GLOBETROTTER_DATA_DIR"] = str(_TEST_DATA_DIR)
atexit.register(lambda: shutil.rmtree(_TEST_DATA_DIR, ignore_errors=True))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def unique_email():
    """A fresh email per test, so tests can run in any order without
    colliding on the 'email already exists' check."""
    return f"test-{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture()
def signed_up_user(client, unique_email):
    """Creates a fresh account and returns (token, user_dict)."""
    res = client.post(
        "/auth/signup",
        json={
            "name": "Test User",
            "email": unique_email,
            "password": "testpass123",
            "preferred_tags": ["nature", "history"],
            "budget_level": "medium",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    return body["access_token"], body["user"]
