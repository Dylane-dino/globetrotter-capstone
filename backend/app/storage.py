"""
Phase 1 storage layer.

This is deliberately NOT a database. Everything is read from and written to
flat JSON files on disk. This is intentional for Phase 1 (Monolith): it lets
us focus on domain modelling and API design without the extra complexity of
a database, and it makes the pain points obvious (no concurrent writes, no
querying, no indexing) that Phase 2 (Microservices) will solve by giving
each service its own real database.

A simple file lock (threading.Lock) is used so that within a single running
process, writes don't corrupt each other. This does NOT protect against
multiple processes/workers writing at once - another limitation we accept
for Phase 1 and remove in later phases.
"""

import json
import os
import threading
from pathlib import Path
from typing import Any

# Overridable via GLOBETROTTER_DATA_DIR so the test suite can point at an
# isolated temp copy instead of ever touching the real seed data on disk.
DATA_DIR = Path(
    os.environ.get("GLOBETROTTER_DATA_DIR")
    or (Path(__file__).resolve().parent.parent / "data")
)

_locks: dict[str, threading.Lock] = {
    "destinations": threading.Lock(),
    "users": threading.Lock(),
    "itineraries": threading.Lock(),
    "community_posts": threading.Lock(),
}


def _path(name: str) -> Path:
    return DATA_DIR / f"{name}.json"


def read_all(name: str) -> list[dict[str, Any]]:
    """Read the full contents of a JSON store."""
    path = _path(name)
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_all(name: str, records: list[dict[str, Any]]) -> None:
    """Overwrite the full contents of a JSON store."""
    lock = _locks.setdefault(name, threading.Lock())
    with lock:
        path = _path(name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)


def find_by_id(name: str, record_id: str) -> dict[str, Any] | None:
    for record in read_all(name):
        if record.get("id") == record_id:
            return record
    return None


def append(name: str, record: dict[str, Any]) -> dict[str, Any]:
    lock = _locks.setdefault(name, threading.Lock())
    with lock:
        records = read_all(name)
        records.append(record)
        path = _path(name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
    return record


def update_by_id(name: str, record_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    lock = _locks.setdefault(name, threading.Lock())
    with lock:
        records = read_all(name)
        for i, record in enumerate(records):
            if record.get("id") == record_id:
                records[i] = {**record, **updates}
                path = _path(name)
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(records, f, indent=2, ensure_ascii=False)
                return records[i]
    return None


def delete_by_id(name: str, record_id: str) -> bool:
    lock = _locks.setdefault(name, threading.Lock())
    with lock:
        records = read_all(name)
        filtered = [r for r in records if r.get("id") != record_id]
        if len(filtered) == len(records):
            return False
        path = _path(name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(filtered, f, indent=2, ensure_ascii=False)
        return True
