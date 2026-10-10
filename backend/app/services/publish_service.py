"""發布服務層

伺服器先重跑作者提交的解法，確定關卡可解才改變狀態：
- 一般使用者 → pending（等管理員審核）
- 管理員 → published（直接上架為社群關卡）

官方關卡不走這條路，寫在 levels/official.txt。
"""
from sqlalchemy.orm import Session

from app.models.level import Level, LevelStatus
from app.models.user import User
from app.schemas.level import Solution
from app.services.play_service import run_solution


def publish_level(db: Session, user: User, level: Level, solution: Solution) -> Level:
    result = run_solution(level.map_data, level.config, solution.as_program())
    level.solution = {**solution.model_dump(), "steps_count": result.steps}
    level.status = LevelStatus.PUBLISHED if user.is_superuser else LevelStatus.PENDING
    db.commit()
    db.refresh(level)
    return level
