import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app import auth, storage
from app.models import CommentCreate, CommunityPost, CommunityPostCreate

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/posts", response_model=list[CommunityPost])
def list_posts():
    """Newest community experiences first."""
    return sorted(storage.read_all("community_posts"), key=lambda post: post["timestamp"], reverse=True)


@router.post("/posts", response_model=CommunityPost, status_code=201)
def create_post(payload: CommunityPostCreate, current_user: dict = Depends(auth.get_current_user)):
    post = {
        "id": str(uuid.uuid4()),
        "user_name": current_user["name"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location_tag": payload.location_tag.strip(),
        "title": payload.title.strip(),
        "body": payload.body.strip(),
        "comments": [],
    }
    return storage.append("community_posts", post)


@router.post("/posts/{post_id}/comments", response_model=CommunityPost)
def add_comment(post_id: str, payload: CommentCreate, current_user: dict = Depends(auth.get_current_user)):
    post = storage.find_by_id("community_posts", post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Community post not found")

    comment = {
        "id": str(uuid.uuid4()),
        "user_name": current_user["name"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "body": payload.body.strip(),
    }
    updated = storage.update_by_id("community_posts", post_id, {"comments": [*post.get("comments", []), comment]})
    return updated
