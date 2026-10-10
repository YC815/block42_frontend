"""Progress schemas."""
from datetime import datetime
from pydantic import BaseModel


class LevelProgressOut(BaseModel):
    """Progress response for a level."""

    level_id: str
    is_completed: bool
    best_steps: int | None = None
    stars_collected: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
